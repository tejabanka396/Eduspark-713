const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a class name'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Please select a grade'],
      enum: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    },
    section: {
      type: String,
      required: [true, 'Please add a section'],
      trim: true,
    },
    room: {
      type: String,
      default: 'Main Building',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherName: {
      type: String,
      default: 'Unassigned',
    },
    capacity: {
      type: Number,
      default: 30,
    },
    studentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', classSchema);
