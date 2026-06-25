const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  titleSlug: String,
  source: {
    type: String,
    required: true,
    enum: ['LeetCode', 'LeetCodePatterns']
  },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  sourceRating: Number,
  topics: [String],
  companies: [{ name: String, frequency: Number }],
  url: String,
  meta: {
    contestId: String,
    index: String,
    premium: Boolean,
    questionId: String
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

problemSchema.index({ source: 1, difficulty: 1 });
problemSchema.index({ topics: 1 });
problemSchema.index({ 'companies.name': 1 });

module.exports = mongoose.model('Problem', problemSchema);
