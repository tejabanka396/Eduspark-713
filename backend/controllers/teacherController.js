const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
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

    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';
    const teacherFilter = isTeacher && teacherId ? { $or: [{ teacherId }, { teacherName: req.user?.name }] } : {};

    try {
      lessonsCount = await Lesson.countDocuments(teacherFilter);
      homeworksCount = await Homework.countDocuments(teacherFilter);
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
    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    try {
      const query = isTeacher && teacherId
        ? {
            $or: [
              { teacherId: teacherId },
              { teacherName: req.user?.name },
              { subject: { $in: req.user?.subjects || [req.user?.subject || 'Mathematics'] } }
            ]
          }
        : {};
      lessonsList = await Lesson.find(query).sort({ createdAt: -1 });
    } catch (e) {
      lessonsList = memoryStore.lessons;
    }
    if (!lessonsList.length && !isTeacher) lessonsList = memoryStore.lessons;
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
    // Convert standard YouTube URLs to embed format if needed
    let embedUrl = '';
    if (youtubeUrl && typeof youtubeUrl === 'string' && youtubeUrl.trim() !== '') {
      const idMatch = youtubeUrl.match(/(?:youtu\.be\/|v=|\/embed\/|watch\?v=)([^&\n?#]+)/);
      const videoId = idMatch ? idMatch[1] : null;
      embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : youtubeUrl;
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
        youtubeUrl: embedUrl,
        teacherId: req.user?._id || req.user?.id,
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
        youtubeUrl: embedUrl,
        teacherId: req.user?._id || req.user?.id,
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
    if (!id) {
      return res.status(400).json({ success: false, message: 'Lesson ID is required for deletion.' });
    }

    let deletedFromDb = false;
    let targetLesson = null;

    // 1. Try finding and deleting from MongoDB if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        targetLesson = await Lesson.findById(id);
        if (targetLesson) {
          // Teacher ownership check
          if (req.user && req.user.role !== 'admin') {
            const userSubjects = req.user.subjects || (req.user.subject ? [req.user.subject] : []);
            const isOwner = targetLesson.teacherName === req.user.name || userSubjects.includes(targetLesson.subject);
            if (!isOwner && targetLesson.teacherName && req.user.name && targetLesson.teacherName !== req.user.name) {
              return res.status(403).json({ success: false, message: 'Not authorized to delete another teacher\'s lesson.' });
            }
          }

          // If local file exists, remove from storage
          if (targetLesson.fileUrl && typeof targetLesson.fileUrl === 'string' && !targetLesson.fileUrl.startsWith('http')) {
            const localFilePath = path.join(__dirname, '..', targetLesson.fileUrl);
            if (fs.existsSync(localFilePath)) {
              try {
                fs.unlinkSync(localFilePath);
              } catch (unlinkErr) {
                console.warn('[Delete Lesson] Could not unlink local file:', unlinkErr.message);
              }
            }
          }

          await Lesson.findByIdAndDelete(id);
          deletedFromDb = true;
        }
      } catch (dbErr) {
        console.warn('[Delete Lesson] Database deletion notice:', dbErr.message);
      }
    }

    // 2. Also remove from memoryStore if present or fallback mode
    const memoryDeleted = memoryStore.deleteLesson(id);

    if (deletedFromDb || memoryDeleted) {
      return res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully.',
        deletedId: id,
      });
    }

    // If ID was not found in DB or memoryStore, check if lesson exists in memory list by loose match
    const fallbackIdx = memoryStore.lessons.findIndex((l) => (l._id || l.id) === id);
    if (fallbackIdx !== -1) {
      memoryStore.lessons.splice(fallbackIdx, 1);
      return res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully.',
        deletedId: id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    console.error('Error in deleteLesson controller:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete lesson.' });
  }
};

/* ==========================================
   HOMEWORK MODULE
   ========================================== */
exports.getHomeworks = async (req, res) => {
  try {
    let homeworksList = [];
    const teacherId = req.user?._id || req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    try {
      const query = isTeacher && teacherId
        ? {
            $or: [
              { teacherId: teacherId },
              { teacherName: req.user?.name },
              { subject: { $in: req.user?.subjects || [req.user?.subject || 'Mathematics'] } }
            ]
          }
        : {};
      homeworksList = await Homework.find(query).sort({ createdAt: -1 });
    } catch (e) {
      homeworksList = memoryStore.homeworks;
    }
    if (!homeworksList.length && !isTeacher) homeworksList = memoryStore.homeworks;
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
        teacherId: req.user?._id || req.user?.id,
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
        teacherId: req.user?._id || req.user?.id,
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
    const {
      grade,
      subject,
      chapter,
      topic,
      difficulty,
      questionType,
      numberOfQuestions,
      totalMarks,
      sourceMaterialText,
      sourceMaterialName,
      saveImmediately,
    } = req.body;

    if (!topic || !subject) {
      return res.status(400).json({ success: false, message: 'Subject and Topic are required for AI Quiz Generator.' });
    }

    const count = Number(numberOfQuestions) || 4;
    const targetGrade = grade || 'Grade 4';
    const targetSubject = subject || 'Mathematics';
    const targetChapter = chapter || 'Chapter 1';
    const targetTopic = topic;
    const targetDiff = difficulty || 'Medium';
    const targetType = questionType || 'mixed';
    const calculatedTotalMarks = Number(totalMarks) || count * 2;

    const quizService = require('../services/gemini/quizGeneratorService');
    const generatedQuiz = await quizService.generateQuiz({
      class: targetGrade,
      subject: targetSubject,
      chapter: targetChapter,
      topic: targetTopic,
      difficulty: targetDiff,
      questionType: targetType,
      numberOfQuestions: count,
      sourceMaterialText: sourceMaterialText || '',
      sourceMaterialName: sourceMaterialName || '',
    });
    
    generatedQuiz.isPublished = saveImmediately ? true : false;

    // the generatedQuiz is already complete from the service

    if (saveImmediately) {
      try {
        const savedQuiz = await Quiz.create({ ...generatedQuiz, isPublished: true });
        return res.status(201).json({
          success: true,
          message: '✨ AI Quiz generated and published successfully!',
          data: savedQuiz,
        });
      } catch (dbErr) {
        const memQuiz = memoryStore.saveQuiz({ ...generatedQuiz, isPublished: true });
        return res.status(201).json({
          success: true,
          message: '✨ AI Quiz generated (Demo mode)!',
          data: memQuiz,
        });
      }
    }

    // Return preview without publishing immediately
    return res.status(200).json({
      success: true,
      message: '✨ AI Quiz preview generated successfully! Review and edit before publishing.',
      data: generatedQuiz,
    });
  } catch (error) {
    console.error('generateAiQuiz error:', error);
    res.status(500).json({ success: false, message: 'AI Quiz Generation failed.' });
  }
};

exports.regenerateQuestion = async (req, res) => {
  try {
    const { grade, subject, chapter, topic, difficulty, questionType, existingQuestions, sourceMaterialText } = req.body;

    const newQuestion = await aiService.regenerateSingleQuestion(
      grade || 'Grade 4',
      subject || 'Mathematics',
      chapter || 'Chapter 1',
      topic || 'General Topic',
      difficulty || 'Medium',
      questionType || 'mixed',
      existingQuestions || [],
      sourceMaterialText || ''
    );

    return res.status(200).json({
      success: true,
      message: 'Question regenerated successfully!',
      data: newQuestion,
    });
  } catch (error) {
    console.error('regenerateQuestion error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate question.' });
  }
};

exports.saveQuiz = async (req, res) => {
  try {
    const quizData = req.body;
    if (!quizData || !quizData.title || !quizData.questions || !quizData.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid quiz payload.' });
    }

    quizData.isPublished = true;

    try {
      if (quizData._id || quizData.id) {
        let existing = null;
        try {
          existing = await Quiz.findById(quizData._id || quizData.id);
        } catch (e) {}

        if (existing) {
          Object.assign(existing, quizData);
          await existing.save();
          return res.status(200).json({ success: true, message: 'Quiz published successfully!', data: existing });
        }
      }
      const savedQuiz = await Quiz.create(quizData);
      return res.status(201).json({ success: true, message: 'Quiz published successfully!', data: savedQuiz });
    } catch (dbErr) {
      const memQuiz = memoryStore.saveQuiz(quizData);
      return res.status(201).json({ success: true, message: 'Quiz published (Demo mode)!', data: memQuiz });
    }
  } catch (error) {
    console.error('saveQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish quiz.' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    try {
      const deleted = await Quiz.findByIdAndDelete(quizId);
      if (deleted) {
        return res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
      }
    } catch (e) {}
    
    // Fallback to memoryStore
    const index = memoryStore.quizzes.findIndex((q) => q.id === quizId || q._id === quizId);
    if (index !== -1) {
      memoryStore.quizzes.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Quiz deleted from demo storage.' });
    }
    
    res.status(404).json({ success: false, message: 'Quiz not found.' });
  } catch (error) {
    console.error('deleteQuiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quiz.' });
  }
};



/* ==========================================
   STUDENT ANALYTICS
   ========================================== */
exports.getStudentAnalytics = async (req, res) => {
  try {
    let students = [];
    let homeworks = [];

    const teacherGrades = req.user?.grades && req.user.grades.length > 0
      ? req.user.grades
      : (req.user?.grade ? [req.user.grade] : ['Grade 4']);
    const studentQuery = req.user?.role === 'admin'
      ? { role: 'student' }
      : { role: 'student', grade: { $in: teacherGrades } };
    
    try {
      students = await User.find(studentQuery).lean();
      homeworks = await Homework.find().lean();
    } catch (dbErr) {
      console.warn('[Teacher Controller] MongoDB unavailable, falling back to memoryStore for analytics:', dbErr.message);
      students = memoryStore.users.filter((u) => u.role === 'student' && (req.user?.role === 'admin' || teacherGrades.includes(u.grade)));
      homeworks = memoryStore.homeworks;
    }
    
    const analyticsData = [];
    
    for (const student of students) {
      // Calculate homework completion
      let completedHws = 0;
      homeworks.forEach((hw) => {
        const submitted = hw.submissions?.some(
          (sub) => sub.studentId === (student._id || student.id).toString()
        );
        if (submitted) {
          completedHws++;
        }
      });
      
      const totalHws = homeworks.length;
      const homeworkCompletion = totalHws > 0 ? Math.round((completedHws / totalHws) * 100) : 100;
      
      // Calculate quiz average
      const quizResults = student.quizResults || [];
      const totalQuizzesTaken = quizResults.length;
      const quizAvg = totalQuizzesTaken > 0
        ? Math.round(quizResults.reduce((acc, q) => acc + q.score, 0) / totalQuizzesTaken)
        : 85; // Default average if no quizzes taken
      
      // Gather weak concepts from failed questions/quizzes
      const weakTopicsSet = new Set();
      quizResults.forEach((r) => {
        if (r.score < 75 && r.weakConcepts) {
          r.weakConcepts.forEach((c) => weakTopicsSet.add(c));
        }
      });
      const weakTopics = Array.from(weakTopicsSet).slice(0, 3);
      if (weakTopics.length === 0) {
        weakTopics.push('None detected yet');
      }
      
      // Gather strong concepts
      const strongTopicsSet = new Set();
      quizResults.forEach((r) => {
        if (r.score >= 80) {
          strongTopicsSet.add(r.quizTitle || 'Core Concepts');
        }
      });
      const strongTopics = Array.from(strongTopicsSet).slice(0, 3);
      if (strongTopics.length === 0) {
        strongTopics.push('Basic Concepts');
      }
      
      // Risk level
      let riskLevel = 'low';
      if (quizAvg < 60 || homeworkCompletion < 50) {
        riskLevel = 'high';
      } else if (quizAvg < 75 || homeworkCompletion < 70) {
        riskLevel = 'medium';
      }
      
      // Personalized recommendation
      let aiRecommendation = '';
      if (riskLevel === 'high') {
        aiRecommendation = `Schedule 1-on-1 conceptual review on ${weakTopics[0] || 'core topics'} and notify parent.`;
      } else if (riskLevel === 'medium') {
        aiRecommendation = `Recommend guided practice exercises on ${weakTopics[0] || 'foundations'} to strengthen mastery.`;
      } else {
        aiRecommendation = `Demonstrating strong pace in ${strongTopics[0] || 'core concepts'}. Assign extension challenges.`;
      }
      
      analyticsData.push({
        studentId: (student._id || student.id).toString(),
        studentName: student.name,
        riskLevel,
        grade: student.grade || teacherGrades[0] || 'Grade 4',
        learningSpeed: quizAvg >= 85 ? 'Fast' : quizAvg >= 70 ? 'Moderate' : 'Needs Support',
        attendance: 96,
        homeworkCompletion,
        quizAverage: quizAvg,
        weakTopics,
        strongTopics,
        aiRecommendation,
      });
    }
    
    res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('getStudentAnalytics error:', error);
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

/* ==========================================
   ATTENDANCE MANAGEMENT
   ========================================== */
exports.getAttendance = async (req, res) => {
  try {
    const { grade, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const teacherGrades = req.user?.grades && req.user.grades.length > 0
      ? req.user.grades
      : (req.user?.grade ? [req.user.grade] : ['Grade 4']);
    const targetGrade = grade || teacherGrades[0];

    let attendanceRecords = [];
    try {
      attendanceRecords = await Attendance.find({ grade: targetGrade, date: targetDate });
    } catch (e) {}

    let students = [];
    try {
      students = await User.find({ role: 'student', grade: targetGrade }).select('name grade');
    } catch (e) {
      students = memoryStore.findByRole('student').filter((s) => s.grade === targetGrade);
    }

    const formattedRecords = students.map((st) => {
      const existing = attendanceRecords.find((a) => a.student?.toString() === (st._id || st.id).toString());
      return {
        studentId: st._id || st.id,
        studentName: st.name,
        grade: st.grade,
        status: existing ? existing.status : 'On Time',
        time: existing ? existing.time : '08:45 AM',
        date: targetDate,
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      grade: targetGrade,
      data: formattedRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, time, notes } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    let student = null;
    try {
      student = await User.findById(studentId);
    } catch (e) {
      student = memoryStore.findById(studentId);
    }

    const studentName = student ? student.name : 'Student';
    const studentGrade = student ? (student.grade || 'Grade 4') : 'Grade 4';

    try {
      let record = await Attendance.findOne({ student: studentId, date: targetDate });
      if (record) {
        record.status = status || 'On Time';
        record.time = time || record.time;
        record.notes = notes || record.notes;
        record.markedBy = req.user?._id;
        await record.save();
      } else {
        record = await Attendance.create({
          student: studentId,
          studentName,
          grade: studentGrade,
          date: targetDate,
          status: status || 'On Time',
          time: time || '08:45 AM',
          markedBy: req.user?._id,
          notes: notes || '',
        });
      }
      return res.status(200).json({
        success: true,
        message: `Attendance marked for ${studentName} as ${status || 'On Time'}`,
        data: record,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        message: `Attendance recorded for ${studentName} as ${status || 'On Time'} (Demo Mode)`,
        data: { studentId, studentName, grade: studentGrade, date: targetDate, status: status || 'On Time' },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.' });
  }
};
