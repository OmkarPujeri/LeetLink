require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require("./routes/problemRoutes");
const User = require('./models/User');
const { verifySolved } = require('./services/verifier');
const { connect } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || 'arena-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/auth', authRoutes);
app.use('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.get('/api/user/progress', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const user = await User.findById(req.user._id);
    res.json({ completedProblems: user.completedProblems || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/user/progress', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { completedProblems } = req.body;
    await User.findByIdAndUpdate(req.user._id, { completedProblems });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.use("/api/problems", problemRoutes);

app.post('/api/verify', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { sourceId } = req.body;
  if (!sourceId) {
    return res.status(400).json({ error: 'sourceId required' });
  }

  const user = await User.findById(req.user.id);
  if (!user.leetcodeUsername) {
    return res.status(400).json({ error: 'Please link your LeetCode username in settings' });
  }

  const Problem = require('./models/Problem');
  const problem = await Problem.findOne({ sourceId }).select('url');
  if (!problem) {
    return res.status(404).json({ error: 'Problem not found' });
  }

  const solved = await verifySolved(user.leetcodeUsername, sourceId, problem.url);
  if (solved) {
    if (!user.solvedProblems.includes(sourceId)) {
      user.solvedProblems.push(sourceId);
      await user.save();
    }
  }
  res.json({ solved });
});

app.post('/api/handle', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { leetcodeUsername } = req.body;
  await User.findByIdAndUpdate(req.user.id, { leetcodeUsername: leetcodeUsername || '' });
  res.json({ success: true });
});

app.get('/', (req, res) => {
    res.json({ message: "Welcome to LeetLink API" });
});

connect().then(() => {
  app.listen(PORT, () => {
    console.log(`[LOG] Server is running on http://localhost:${PORT}`);
  });
});
