const User = require('../models/User');
const memoryStore = require('../utils/memoryStore');

// @desc    Get Parent Dashboard Overview, Attendance, Performance & AI Recommendations
// @route   GET /api/parent/dashboard
// @access  Private (Parent)
exports.getParentDashboard = async (req, res) => {
  try {
    const childProfile = {
      name: 'Leo Vance',
      grade: 'Grade 4 - Alpha',
      teacherName: 'Prof. John Keating',
      school: 'EduSpark Primary Academy',
    };

    const attendanceStats = {
      monthlyPercentage: 98.0,
      totalDaysPresent: 22,
      totalDaysAbsent: 0,
      lateArrivalsCount: 1,
      attendanceLog: [
        { date: '2026-07-24', status: 'On Time', time: '08:45 AM' },
        { date: '2026-07-23', status: 'On Time', time: '08:50 AM' },
        { date: '2026-07-22', status: 'Late Arrival', time: '09:12 AM' },
        { date: '2026-07-21', status: 'On Time', time: '08:42 AM' },
        { date: '2026-07-20', status: 'On Time', time: '08:48 AM' },
      ],
    };

    const performanceCharts = {
      weeklyGrowth: [
        { week: 'Week 1', score: 82, homework: 85 },
        { week: 'Week 2', score: 86, homework: 90 },
        { week: 'Week 3', score: 89, homework: 92 },
        { week: 'Week 4', score: 95, homework: 95 },
      ],
      subjectComparison: [
        { subject: 'Mathematics', score: 92, classAverage: 84 },
        { subject: 'Science', score: 95, classAverage: 89 },
        { subject: 'English', score: 88, classAverage: 86 },
        { subject: 'Social Studies', score: 90, classAverage: 85 },
      ],
    };

    const aiRecommendations = [
      { id: 1, text: 'Practice subtraction and fraction reduction for 15 mins daily.', category: 'Math' },
      { id: 2, text: 'Read for 20 minutes before bedtime to boost vocabulary.', category: 'Reading' },
      { id: 3, text: 'Encourage handwriting exercises for notebook assignments.', category: 'Writing' },
      { id: 4, text: 'Great progress in Science! Praise Leo for photosynthesis quiz score.', category: 'Praise' },
    ];

    const upcomingActivities = [
      { id: 1, title: 'Annual Primary Science Fair', date: 'July 30, 2026', time: '10:00 AM' },
      { id: 2, title: 'Parent-Teacher Consultations', date: 'August 5, 2026', time: '02:00 PM' },
    ];

    res.status(200).json({
      success: true,
      childProfile,
      attendanceStats,
      performanceCharts,
      aiRecommendations,
      upcomingActivities,
      homeworkSummary: memoryStore.homeworks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch parent dashboard.' });
  }
};

// @desc    Get Teacher Chat & Availability (Working Hours: 9 AM - 4 PM)
// @route   GET /api/parent/chat
// @access  Private (Parent)
exports.getTeacherChat = async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    // Working hours strictly 9 AM (9) to 4 PM (16)
    const isWorkingHours = currentHour >= 9 && currentHour < 16;

    const messages = [
      {
        id: 1,
        sender: 'Prof. John Keating (Teacher)',
        text: 'Hello Mrs. Vance! Leo did fantastic on his equivalent fractions exercise today.',
        timestamp: '10:30 AM',
        isTeacher: true,
      },
      {
        id: 2,
        sender: 'Eleanor Vance (Parent)',
        text: 'Thank you Professor! We will practice the subtraction worksheet at home tonight.',
        timestamp: '11:15 AM',
        isTeacher: false,
      },
    ];

    res.status(200).json({
      success: true,
      isWorkingHours,
      workingHoursNotice: isWorkingHours
        ? 'Teacher is currently available (9:00 AM – 4:00 PM).'
        : 'Teacher is currently unavailable. Working hours are 9:00 AM – 4:00 PM.',
      teacherName: 'Prof. John Keating',
      messages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat.' });
  }
};

// @desc    Send Message to Teacher
// @route   POST /api/parent/chat/send
// @access  Private (Parent)
exports.sendTeacherMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const isWorkingHours = currentHour >= 9 && currentHour < 16;

    const newMessage = {
      id: Date.now(),
      sender: req.user?.name || 'Eleanor Vance (Parent)',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTeacher: false,
    };

    res.status(200).json({
      success: true,
      isWorkingHours,
      messageSent: newMessage,
      notice: isWorkingHours
        ? 'Message delivered to teacher!'
        : 'Message queued. Teacher is currently unavailable (Working hours: 9 AM – 4 PM).',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// @desc    Book Parent-Teacher Appointment
// @route   POST /api/parent/appointment
// @access  Private (Parent)
exports.bookAppointment = async (req, res) => {
  try {
    const { date, timeSlot, topic } = req.body;
    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Date and time slot required.' });
    }

    res.status(200).json({
      success: true,
      message: `Appointment booked with Prof. John Keating for ${date} at ${timeSlot}!`,
      appointment: { date, timeSlot, topic: topic || 'Learning Growth Review' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to book appointment.' });
  }
};
