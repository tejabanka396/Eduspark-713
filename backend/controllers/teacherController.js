const Lesson = require('../models/Lesson');
const Homework = require('../models/Homework');
const Quiz = require('../models/Quiz');
const memoryStore = require('../utils/memoryStore');
const aiService = require('../services/aiService');

// @desc    Get Teacher Overview Stats & Alerts
// @route   GET /api/teacher/stats
// @access  Private (Teacher)
exports.getTeacherStats = async (req, res) => {
  try {
    let lessonsCount = 0;
    let homeworksCount = 0;
    let quizzesCount = 0;

    try {
      lessonsCount = await Lesson.countDocuments();
      homeworksCount = await Homework.countDocuments();
      quizzesCount = await Quiz.countDocuments();
    } catch (e) {
      lessonsCount = memoryStore.lessons.length;
      homeworksCount = memoryStore.homeworks.length;
      quizzesCount = memoryStore.quizzes.length;
    }

    const announcements = [
      { id: 1, title: 'Science Fair Project Due', date: '2026-07-30', target: 'Grade 4 & 5' },
      { id: 2, title: 'Parent-Teacher Meeting Window', date: '2026-08-05', target: 'All Parents' },
    ];

    const alerts = [
      { id: 1, type: 'warning', text: 'Oliver Smith has missed 2 consecutive fraction assignments.' },
      { id: 2, type: 'info', text: 'Maya Lin requested AI hints for decimal division.' },
    ];

    res.status(200).json({
      success: true,
      stats: {
        todaysClassesCount: 4,
        pendingHomeworksCount: 2,
        lessonsCount: lessonsCount || memoryStore.lessons.length,
        quizzesCount: quizzesCount || memoryStore.quizzes.length,
        weeklyProgress: 88,
      },
      announcements,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teacher stats.' });
  }
};

/* ==========================================
   LESSON MANAGEMENT
   ========================================== */
exports.getLessons = async (req, res) => {
  try {
    let lessonsList = [];
    try {
      lessonsList = await Lesson.find().sort({ createdAt: -1 });
    } catch (e) {
      lessonsList = memoryStore.lessons;
    }
    if (!lessonsList.length) lessonsList = memoryStore.lessons;
    res.status(200).json({ success: true, count: lessonsList.length, data: lessonsList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lessons.' });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const { title, description, grade, subject, category, contentType, fileUrl, youtubeUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required.' });
    }

    try {
      const lesson = await Lesson.create({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        category: category || 'daily',
        contentType: contentType || 'video',
        fileUrl: fileUrl || '',
        youtubeUrl: youtubeUrl || '',
        teacherName: req.user?.name || 'Prof. John Keating',
      });
      return res.status(201).json({ success: true, message: 'Lesson created successfully!', data: lesson });
    } catch (dbErr) {
      const memLesson = memoryStore.saveLesson({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        category: category || 'daily',
        contentType: contentType || 'video',
        fileUrl: fileUrl || '',
        youtubeUrl: youtubeUrl || '',
        teacherName: req.user?.name || 'Prof. John Keating',
      });
      return res.status(201).json({ success: true, message: 'Lesson created (Demo mode)!', data: memLesson });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating lesson.' });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Lesson.findByIdAndDelete(id);
    } catch (e) {}
    memoryStore.deleteLesson(id);
    res.status(200).json({ success: true, message: 'Lesson deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting lesson.' });
  }
};

/* ==========================================
   HOMEWORK MODULE
   ========================================== */
exports.getHomeworks = async (req, res) => {
  try {
    let homeworksList = [];
    try {
      homeworksList = await Homework.find().sort({ createdAt: -1 });
    } catch (e) {
      homeworksList = memoryStore.homeworks;
    }
    if (!homeworksList.length) homeworksList = memoryStore.homeworks;
    res.status(200).json({ success: true, count: homeworksList.length, data: homeworksList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch homework assignments.' });
  }
};

exports.createHomework = async (req, res) => {
  try {
    const { title, description, grade, subject, dueDate, totalMarks } = req.body;
    if (!title || !description || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, description, and due date required.' });
    }

    try {
      const homework = await Homework.create({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        dueDate,
        totalMarks: totalMarks || 100,
        teacherName: req.user?.name || 'Prof. John Keating',
        submissions: [],
      });
      return res.status(201).json({ success: true, message: 'Homework created!', data: homework });
    } catch (dbErr) {
      const memHw = memoryStore.saveHomework({
        title,
        description,
        grade: grade || 'Grade 4',
        subject: subject || 'Mathematics',
        dueDate,
        totalMarks: totalMarks || 100,
        teacherName: req.user?.name || 'Prof. John Keating',
      });
      return res.status(201).json({ success: true, message: 'Homework created (Demo mode)!', data: memHw });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating homework.' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { hwId, subId } = req.params;
    const { marksObtained, feedback } = req.body;

    try {
      const hw = await Homework.findById(hwId);
      if (hw) {
        const sub = hw.submissions.id(subId);
        if (sub) {
          sub.marksObtained = Number(marksObtained);
          sub.feedback = feedback || '';
          sub.status = 'graded';
          await hw.save();
          return res.status(200).json({ success: true, message: 'Submission graded successfully!', data: sub });
        }
      }
    } catch (e) {}

    const graded = memoryStore.gradeSubmission(hwId, subId, Number(marksObtained), feedback);
    res.status(200).json({ success: true, message: 'Submission graded!', data: graded });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to grade submission.' });
  }
};

/* ==========================================
   AI QUIZ GENERATOR & QUIZZES (POWERED BY AI SERVICE)
   ========================================== */
exports.getQuizzes = async (req, res) => {
  try {
    let quizList = [];
    try {
      quizList = await Quiz.find().sort({ createdAt: -1 });
    } catch (e) {
      quizList = memoryStore.quizzes;
    }
    if (!quizList.length) quizList = memoryStore.quizzes;
    res.status(200).json({ success: true, count: quizList.length, data: quizList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' });
  }
};

exports.generateAiQuiz = async (req, res) => {
  try {
    const { grade, subject, topic, difficulty, numberOfQuestions } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required for AI Quiz Generator.' });
    }

    const count = Number(numberOfQuestions) || 4;
    const targetGrade = grade || 'Grade 4';
    const targetSubject = subject || 'Mathematics';
    const targetDiff = difficulty || 'Medium';

    // Call AI Service
    const questions = await aiService.generateAdaptiveQuiz(targetGrade, targetSubject, topic, targetDiff, count);

    const generatedQuiz = {
      title: `${targetGrade} ${targetSubject}: ${topic} (AI Generated)`,
      grade: targetGrade,
      subject: targetSubject,
      topic,
      difficulty: targetDiff,
      questions,
      isPublished: true,
    };

    try {
      const savedQuiz = await Quiz.create(generatedQuiz);
      return res.status(201).json({
        success: true,
        message: '✨ AI Quiz generated and published successfully!',
        data: savedQuiz,
      });
    } catch (dbErr) {
      const memQuiz = memoryStore.saveQuiz(generatedQuiz);
      return res.status(201).json({
        success: true,
        message: '✨ AI Quiz generated (Demo mode)!',
        data: memQuiz,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI Quiz Generation failed.' });
  }
};

/* ==========================================
   STUDENT ANALYTICS
   ========================================== */
exports.getStudentAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: memoryStore.studentAnalytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student analytics.' });
  }
};

/* ==========================================
   PARENT COMMUNICATION & WORKING HOURS
   ========================================== */
exports.getWorkingHoursStatus = async (req, res) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isWorkingHours = currentHour >= 9 && currentHour < 16;

  res.status(200).json({
    success: true,
    isWorkingHours,
    workingHours: '9:00 AM – 4:00 PM',
    message: isWorkingHours
      ? 'Teacher is currently available for parent communication.'
      : 'Teacher is currently unavailable. Working hours are 9 AM – 4 PM.',
  });
};
