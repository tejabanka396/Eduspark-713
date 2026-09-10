const express = require('express');
const router = express.Router();
const { protect, authorize, requireSubjectOwnership } = require('../middleware/authMiddleware');
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
  regenerateQuestion,
  saveQuiz,
  getStudentAnalytics,
  getWorkingHoursStatus,
  deleteQuiz,
  getAttendance,
  markAttendance,
} = require('../controllers/teacherController');

// Protect all routes; require role 'teacher' or 'admin'
router.use(protect);
router.use(authorize('teacher', 'admin'));

// Stats & Working Hours
router.get('/stats', getTeacherStats);
router.get('/working-hours', getWorkingHoursStatus);

// Attendance
router.route('/attendance').get(getAttendance).post(markAttendance);

// Lesson Management
router.route('/lessons').get(getLessons).post(requireSubjectOwnership, createLesson);
router.route('/lessons/:id').delete(deleteLesson);

// Homework Module
router.route('/homeworks').get(getHomeworks).post(requireSubjectOwnership, createHomework);
router.put('/homeworks/:hwId/grade/:subId', gradeSubmission);

// Quiz & AI Quiz Generator
router.get('/quizzes', getQuizzes);
router.post('/quizzes/generate-ai', requireSubjectOwnership, generateAiQuiz);
router.post('/quizzes/regenerate-question', regenerateQuestion);
router.post('/quizzes/save', saveQuiz);
router.delete('/quizzes/:id', deleteQuiz);

// Student Analytics
router.get('/analytics', getStudentAnalytics);

module.exports = router;
