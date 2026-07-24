const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a lesson title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    grade: {
      type: String,
      required: true,
      default: 'Grade 4',
    },
    subject: {
      type: String,
      required: true,
      default: 'Mathematics',
    },
    category: {
      type: String,
      enum: ['daily', 'weekly', 'notes', 'worksheet'],
      default: 'daily',
    },
    contentType: {
      type: String,
      enum: ['video', 'pdf', 'image', 'text'],
      default: 'video',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    youtubeUrl: {
      type: String,
      default: '',
    },
    teacherName: {
      type: String,
      default: 'Prof. John Keating',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lesson', lessonSchema);
