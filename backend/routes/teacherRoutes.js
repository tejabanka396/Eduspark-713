const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getTeacherStats,
  getLessons,
  createLesson,
  deleteLesson,
  getHomeworks,
  createHomework,
  gradeSubmission,
  getQuizzes,
  generateAiQuiz,
  getStudentAnalytics,
  getWorkingHoursStatus,
} = require('../controllers/teacherController');

// Protect all routes; require role 'teacher' or 'admin'
router.use(protect);
router.use(authorize('teacher', 'admin'));

// Stats & Working Hours
router.get('/stats', getTeacherStats);
router.get('/working-hours', getWorkingHoursStatus);

// Lesson Management
router.route('/lessons').get(getLessons).post(createLesson);
router.route('/lessons/:id').delete(deleteLesson);

// Homework Module
router.route('/homeworks').get(getHomeworks).post(createHomework);
router.put('/homeworks/:hwId/grade/:subId', gradeSubmission);

// Quiz & AI Quiz Generator
router.get('/quizzes', getQuizzes);
router.post('/quizzes/generate-ai', generateAiQuiz);

// Student Analytics
router.get('/analytics', getStudentAnalytics);

module.exports = router;
