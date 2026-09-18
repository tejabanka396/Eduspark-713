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
    youtubeVideoId: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    className: {
      type: String,
      default: 'Grade 4 - Alpha',
    },
    classId: {
      type: String,
      default: '',
    },
    subjectId: {
      type: String,
      default: '',
    },
    chapter: {
      type: String,
      default: 'Chapter 1: Fractions & Decimals',
    },
    chapterId: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: 'Basic Fractions',
    },
    topicId: {
      type: String,
      default: '',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherName: {
      type: String,
      default: 'Prof. John Keating',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Aliases for snake_case compatibility
lessonSchema.virtual('youtube_url').get(function () { return this.youtubeUrl; });
lessonSchema.virtual('youtube_video_id').get(function () { return this.youtubeVideoId; });
lessonSchema.virtual('class_id').get(function () { return this.classId || this.className || this.grade; });
lessonSchema.virtual('subject_id').get(function () { return this.subjectId || this.subject; });
lessonSchema.virtual('chapter_id').get(function () { return this.chapterId || this.chapter; });
lessonSchema.virtual('topic_id').get(function () { return this.topicId || this.topic; });

module.exports = mongoose.model('Lesson', lessonSchema);
