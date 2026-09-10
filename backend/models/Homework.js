const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  content: String,
  fileUrl: String,
  submittedAt: { type: Date, default: Date.now },
  marksObtained: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
});

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add homework title'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      default: 'Grade 4',
    },
    subject: {
      type: String,
      default: 'Mathematics',
    },
    dueDate: {
      type: String,
      required: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherName: {
      type: String,
      default: 'Prof. John Keating',
    },
    submissions: [submissionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Homework', homeworkSchema);
