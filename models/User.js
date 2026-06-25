const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: String,
  rating: { type: Number, default: 1200 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  duelsPlayed: { type: Number, default: 0 },
  solvedProblems: [{ type: String }],
  completedProblems: [{ type: String }],
  codeforcesHandle: { type: String, default: '' },
  leetcodeUsername: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
