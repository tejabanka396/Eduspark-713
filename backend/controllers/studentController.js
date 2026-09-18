const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Quiz = require('../models/Quiz');
const memoryStore = require('../utils/memoryStore');
const aiService = require('../services/aiService');
const ocrService = require('../services/ocrService');

const homeworkHelper = require('../services/gemini/homeworkHelperService');
const { extractYouTubeVideoId } = require('../utils/youtubeValidator');

// @desc    Get Student Dashboard Overview & Gamification Data
// @route   GET /api/student/dashboard
// @access  Private (Student)
exports.getStudentDashboardData = async (req, res) => {
  try {
    let lessonsList = [];
    let hwList = [];
    let quizList = [];
    const studentGrade = req.user?.grade || 'Grade 4';
    const studentClass = req.user?.assignedClass || 'Grade 4 - Alpha';

    const lessonFilter = {
      $or: [
        { grade: studentGrade },
        { className: studentClass },
        { className: studentGrade },
      ],
    };

    try {
      lessonsList = await Lesson.find(lessonFilter).sort({ createdAt: -1 });
      hwList = await Homework.find({ grade: studentGrade }).sort({ createdAt: -1 });
      quizList = await Quiz.find({ grade: studentGrade }).sort({ createdAt: -1 });
    } catch (e) {
      lessonsList = (memoryStore.lessons || []).filter(
        (l) =>
          (l.grade || '').toLowerCase() === studentGrade.toLowerCase() ||
          (l.className || '').toLowerCase() === studentClass.toLowerCase()
      );
      hwList = (memoryStore.homeworks || []).filter((h) => (h.grade || '').toLowerCase() === studentGrade.toLowerCase());
      quizList = (memoryStore.quizzes || []).filter((q) => (q.grade || '').toLowerCase() === studentGrade.toLowerCase());
    }

    if (!lessonsList.length) {
      lessonsList = (memoryStore.lessons || []).filter(
        (l) =>
          (l.grade || '').toLowerCase() === studentGrade.toLowerCase() ||
          (l.className || '').toLowerCase() === studentClass.toLowerCase()
      );
    }
    if (!hwList.length) hwList = (memoryStore.homeworks || []).filter((h) => (h.grade || '').toLowerCase() === studentGrade.toLowerCase());
    if (!quizList.length) quizList = (memoryStore.quizzes || []).filter((q) => (q.grade || '').toLowerCase() === studentGrade.toLowerCase());

    // Normalize lessons with videoId and thumbnail
    const normalizedLessons = lessonsList.map((item) => {
      const doc = item.toObject ? item.toObject() : { ...item };
      if (doc.youtubeUrl && !doc.youtubeVideoId) {
        doc.youtubeVideoId = extractYouTubeVideoId(doc.youtubeUrl);
      }
      if (doc.youtubeVideoId && !doc.thumbnail) {
        doc.thumbnail = `https://img.youtube.com/vi/${doc.youtubeVideoId}/hqdefault.jpg`;
      }
      return doc;
    });

    let attendanceLog = [];
    try {
      const Attendance = require('../models/Attendance');
      attendanceLog = await Attendance.find({ student: req.user?._id || req.user?.id }).sort({ date: -1 }).limit(10);
    } catch (e) {}

    const studentProfile = {
      name: req.user?.name || 'Aarav Sharma',
      grade: studentGrade,
      assignedClass: studentClass,
      streak: req.user?.streak || 5,
      stars: req.user?.stars || 140,
      coins: req.user?.coins || 320,
      dailyMotivation: '🌟 "Small steps every day lead to big achievements! Keep up the great learning!"',
    };

    res.status(200).json({
      success: true,
      profile: studentProfile,
      lessons: normalizedLessons,
      homeworks: hwList,
      quizzes: quizList,
      attendance: attendanceLog,
      achievements: memoryStore.achievements,
      bookmarks: memoryStore.bookmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load student dashboard.' });
  }
};

// @desc    AI Homework Helper (Educational Step-by-Step Guidance with Conversational Context)
// @route   POST /api/student/ai-helper
// @access  Private (Student)
exports.aiHomeworkHelper = async (req, res) => {
  try {
    const { question, grade, history, previousContext, subject } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your homework question.' });
    }

    const targetGrade = grade || req.user?.grade || 'Grade 4';
    const targetSubject = subject || 'Mathematics';

    const result = await homeworkHelper.solveHomework({
      questionText: question.trim(),
      studentClass: targetGrade,
      subject: targetSubject,
      history: Array.isArray(history) ? history : [],
      previousContext: previousContext || '',
    });

    res.status(200).json({
      success: true,
      question,
      data: result,
      aiResponse: {
        understandTheQuestion: result.understandTheQuestion,
        steps: result.steps || result.stepByStepSolution,
        stepByStepSolution: result.stepByStepSolution || result.steps,
        finalAnswer: result.finalAnswer,
        quickTip: result.quickTip,
        explanation: result.explanation,
        provider: result.provider,
        ruleEnforced: 'AI Tutor gives structured step-by-step guidance!',
      },
    });
  } catch (error) {
    console.error('AI Homework Helper error:', error);
    res.status(500).json({ success: false, message: 'AI Homework Helper error: ' + error.message });
  }
};

// @desc    AI Voice Tutor (Speech-to-Text & Gemini Child-Friendly Response)
// @route   POST /api/student/voice-tutor
// @access  Private (Student)
exports.aiVoiceTutor = async (req, res) => {
  try {
    const { voiceQuestion, grade } = req.body;

    if (!voiceQuestion) {
      return res.status(400).json({ success: false, message: 'Voice input not received.' });
    }

    const aiVoice = await aiService.generateVoiceTutorResponse(voiceQuestion, grade || req.user?.grade || 'Grade 4');

    res.status(200).json({
      success: true,
      voiceQuestion,
      spokenResponse: aiVoice.spokenText,
      provider: aiVoice.provider,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Voice Tutor error.' });
  }
};

// @desc    OCR Homework Scanner (Powered by Gemini Multimodal Vision / Google Vision)
// @route   POST /api/student/ocr-scan
// @access  Private (Student)
exports.ocrScanNotebook = async (req, res) => {
  try {
    let imageInput = req.body.imageDataBase64 || req.body.imageUrl || '';
    const mimeType = req.body.mimeType || 'image/jpeg';

    if (req.file) {
      imageInput = req.file.buffer;
    }

    const ocrResult = await ocrService.extractHandwrittenText(imageInput, mimeType);

    // Automatically solve extracted question using Homework Helper
    let solution = null;
    if (ocrResult.extractedText && ocrResult.extractedText !== 'No text detected.') {
      try {
        solution = await homeworkHelper.solveHomework({
          questionText: ocrResult.extractedText,
          studentClass: req.user?.grade || 'Grade 4',
        });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      ocrResult,
      extractedText: ocrResult.extractedText,
      solution,
    });
  } catch (error) {
    console.error('OCR scan error:', error);
    res.status(500).json({ success: false, message: 'OCR scan error: ' + error.message });
  }
};

// @desc    Submit Homework
// @route   POST /api/student/homework/:hwId/submit
// @access  Private (Student)
exports.submitHomework = async (req, res) => {
  try {
    const { hwId } = req.params;
    const { content, fileUrl, ocrText } = req.body;

    const subData = {
      studentId: req.user?._id || req.user?.id || 'demo-student-id-004',
      studentName: req.user?.name || 'Leo Vance',
      content: ocrText ? `[OCR Scanned Notebook Handwriting]:\n${ocrText}` : (content || 'Homework submitted.'),
      fileUrl: fileUrl || '',
      submittedAt: new Date(),
      status: 'submitted',
    };

    try {
      const hw = await Homework.findById(hwId);
      if (hw) {
        hw.submissions.push(subData);
        await hw.save();
        return res.status(200).json({ success: true, message: 'Homework notebook submission uploaded & saved for teacher review!' });
      }
    } catch (e) {}

    memoryStore.addHomeworkSubmission(hwId, subData);
    res.status(200).json({ success: true, message: 'Homework notebook submission uploaded & saved for teacher review (Demo Mode)!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit homework.' });
  }
};

// @desc    Submit Quiz & Evaluate Results
// @route   POST /api/student/quiz/:quizId/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    let quiz = null;
    try {
      quiz = await Quiz.findById(quizId);
    } catch (e) {
      quiz = memoryStore.quizzes.find((q) => q.id === quizId || q._id === quizId);
    }
    if (!quiz) {
      quiz = memoryStore.quizzes.find((q) => q.id === quizId || q._id === quizId);
    }

    if (!quiz || !quiz.questions) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const weakTopics = [];

    quiz.questions.forEach((q, idx) => {
      const userAns = answers ? answers[idx] : '';
      if (userAns && userAns.toString().trim().toLowerCase() === q.correctAnswer.toString().trim().toLowerCase()) {
        correctCount++;
      } else {
        weakTopics.push(q.question);
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Save to student's quizResults in MongoDB
    if (req.user && req.user._id) {
      try {
        const student = await User.findById(req.user._id);
        if (student) {
          student.quizResults = student.quizResults || [];
          student.quizResults.push({
            quizId: quiz._id || quiz.id,
            quizTitle: quiz.title,
            subject: quiz.subject,
            score: scorePercentage,
            correctCount,
            totalQuestions,
            weakConcepts: weakTopics.length ? weakTopics : []
          });
          await student.save();
        }
      } catch (saveErr) {
        console.error('Error saving student quiz results:', saveErr.message);
      }
    }

    const weaknessAnalysis = await aiService.detectWeakTopicsAndGaps({ quizAverage: scorePercentage });
    const forecast = await aiService.predictPerformanceAndTrend({ quizAverage: scorePercentage });

    res.status(200).json({
      success: true,
      quizTitle: quiz.title,
      score: scorePercentage,
      correctCount,
      totalQuestions,
      weakConcepts: weakTopics.length ? weakTopics : ['None! Perfect score!'],
      recommendedRevision: scorePercentage >= 80 ? 'You mastered this topic! Try the advanced practice.' : 'Revise fractions diagrams and practice 10 mins daily.',
      starsEarned: 20,
      coinsEarned: 50,
      aiAnalysis: {
        riskLevel: weaknessAnalysis.riskLevel,
        predictedExamScore: forecast.predictedExamScore,
        learningTrend: forecast.learningTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit quiz.' });
  }
};

// @desc    Toggle Bookmark Lesson
// @route   POST /api/student/bookmark/:lessonId
// @access  Private (Student)
exports.toggleBookmark = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const isBookmarked = memoryStore.toggleBookmark(lessonId);

    res.status(200).json({
      success: true,
      isBookmarked,
      message: isBookmarked ? 'Lesson bookmarked!' : 'Lesson removed from bookmarks.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

// @desc    Get AI Performance Forecast & Weak Topic Detection
// @route   GET /api/student/ai-forecast
// @access  Private (Student)
exports.getStudentAiForecast = async (req, res) => {
  try {
    const quizResults = req.user?.quizResults || [];
    const quizAvg = quizResults.length > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + (q.score || 0), 0) / quizResults.length)
      : 88;

    const history = {
      quizAverage: quizAvg,
      homeworkCompletion: 92,
      studentName: req.user?.name || 'Student',
      studentId: req.user?._id || req.user?.id,
    };
    const forecast = await aiService.predictPerformanceAndTrend(history);
    const weakness = await aiService.detectWeakTopicsAndGaps(history);

    res.status(200).json({
      success: true,
      forecast,
      weakness,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch AI forecast.' });
  }
};
