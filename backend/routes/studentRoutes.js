const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStudentDashboardData,
  aiHomeworkHelper,
  aiVoiceTutor,
  ocrScanNotebook,
  submitHomework,
  submitQuiz,
  toggleBookmark,
  getStudentAiForecast,
} = require('../controllers/studentController');

// Require authentication and role student or admin
router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/dashboard', getStudentDashboardData);
router.post('/ai-helper', aiHomeworkHelper);
router.post('/voice-tutor', aiVoiceTutor);
router.post('/ocr-scan', ocrScanNotebook);
router.post('/homework/:hwId/submit', submitHomework);
router.post('/quiz/:quizId/submit', submitQuiz);
router.post('/bookmark/:lessonId', toggleBookmark);
router.get('/ai-forecast', getStudentAiForecast);

module.exports = router;
