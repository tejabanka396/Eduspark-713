const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getParentDashboard,
  getTeacherChat,
  sendTeacherMessage,
  bookAppointment,
} = require('../controllers/parentController');

// Require authentication and role parent or admin
router.use(protect);
router.use(authorize('parent', 'admin'));

router.get('/dashboard', getParentDashboard);
router.get('/chat', getTeacherChat);
router.post('/chat/send', sendTeacherMessage);
router.post('/appointment', bookAppointment);

module.exports = router;
