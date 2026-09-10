const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a subject name'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    grade: {
      type: String,
      default: 'All Grades',
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '📚',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
