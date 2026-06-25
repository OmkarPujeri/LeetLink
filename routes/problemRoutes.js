const express = require("express");
const router = express.Router();
const Problem = require("../models/Problem");

const SAFE_FIELDS = "sourceId title difficulty topics companies url source sourceRating";

router.get("/stats", async (req, res) => {
  try {
    const [total, easy, medium, hard] = await Promise.all([
      Problem.countDocuments({ active: true }),
      Problem.countDocuments({ difficulty: 'Easy', active: true }),
      Problem.countDocuments({ difficulty: 'Medium', active: true }),
      Problem.countDocuments({ difficulty: 'Hard', active: true }),
    ]);

    res.json({
      total,
      difficulty: {
        Easy: easy,
        Medium: medium,
        Hard: hard
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { difficulty, topic, company, search, source, limit, page } = req.query;
    const filter = { active: true };

    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (topic && topic !== 'All') filter.topics = topic;
    if (company && company !== 'All') filter["companies.name"] = { $regex: company, $options: "i" };
    if (source) filter.source = source;
    if (search) filter.title = { $regex: search, $options: "i" };

    const pageSize = Math.min(parseInt(limit) || 50, 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const skip = (currentPage - 1) * pageSize;

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select(SAFE_FIELDS)
        .sort({ sourceId: 1 })
        .skip(skip)
        .limit(pageSize),
      Problem.countDocuments(filter)
    ]);

    res.json({
      problems,
      total,
      pages: Math.ceil(total / pageSize),
      currentPage
    });
  } catch (err) {
    console.error("Error fetching problems:", err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const problem = await Problem.findOne({ sourceId: req.params.id, active: true })
      .select(SAFE_FIELDS);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }
    res.json(problem);
  } catch (err) {
    console.error("Error fetching problem:", err);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

module.exports = router;
