const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    badgeType: { type: String, enum: ['streak', 'quiz_master', 'helper', 'reader', 'math_hero'], default: 'quiz_master' },
    icon: { type: String, default: '⭐' },
    starsReward: { type: Number, default: 20 },
    coinsReward: { type: Number, default: 50 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);
