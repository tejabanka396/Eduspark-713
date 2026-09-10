const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  handleAiTutor,
  handleHomeworkHelper,
  handleQuizGenerate,
  handleOcrScan,
  handleContentAnalyze,
  handleStudentInsights,
  handleTeacherInsights,
} = require('../controllers/aiController');

// Rate Limiting Protection for AI Endpoints (60 requests per 15 mins)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many AI requests from this session. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect all AI endpoints
router.use(protect);
router.use(aiLimiter);

// AI Tutor (Multi-turn)
router.post('/tutor', handleAiTutor);

// AI Homework Helper (Multimodal)
router.post('/homework', handleHomeworkHelper);

// AI Quiz Generator (Structured JSON)
router.post('/quiz/generate', handleQuizGenerate);

// Multimodal OCR + AI Scanner
router.post('/ocr-scan', upload.single('image'), handleOcrScan);

// Teacher Content Analyzer
router.post('/content/analyze', handleContentAnalyze);

// Student Performance Insights
router.post('/student-insights', handleStudentInsights);

// Teacher Classroom Insights
router.post('/teacher-insights', handleTeacherInsights);

module.exports = router;
