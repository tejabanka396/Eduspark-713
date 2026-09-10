const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'fill_blank', 'true_false', 'short'], default: 'mcq' },
  options: [String],
  correctAnswer: { type: String, required: true },
  explanation: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  marks: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add quiz title'],
    },
    grade: {
      type: String,
      default: 'Grade 4',
    },
    subject: {
      type: String,
      default: 'Mathematics',
    },
    chapter: {
      type: String,
      default: 'General',
    },
    topic: {
      type: String,
      default: 'General Topic',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    questionType: {
      type: String,
      default: 'mixed',
    },
    totalMarks: {
      type: Number,
      default: 10,
    },
    sourceMaterialName: {
      type: String,
      default: '',
    },
    questions: [questionSchema],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);

