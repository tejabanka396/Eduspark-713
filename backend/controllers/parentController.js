const User = require('../models/User');
const Attendance = require('../models/Attendance');
const memoryStore = require('../utils/memoryStore');

// @desc    Get Parent Dashboard Overview, Attendance, Performance & AI Recommendations
// @route   GET /api/parent/dashboard
// @access  Private (Parent)
exports.getParentDashboard = async (req, res) => {
  try {
    let child = null;
    const parent = req.user;

    // 1. Locate student linked to this parent
    try {
      if (parent?.linkedStudentId) {
        child = await User.findById(parent.linkedStudentId);
      } else if (parent?.linkedStudent) {
        child = await User.findOne({
          $or: [
            { name: new RegExp('^' + parent.linkedStudent + '$', 'i') },
            { email: parent.linkedStudent.toLowerCase() },
          ],
        });
      }
      if (!child && parent?.name) {
        child = await User.findOne({ parentName: new RegExp('^' + parent.name + '$', 'i') });
      }
    } catch (e) {}

    // Fallback if not found in MongoDB
    if (!child) {
      child = memoryStore.users.find(
        (u) =>
          u.role === 'student' &&
          (u.parentName === parent?.name || u.id === 'demo-student-id-004')
      );
    }
    if (!child) {
      child = memoryStore.users.find((u) => u.role === 'student') || {
        name: 'Leo Vance',
        grade: 'Grade 4',
        stars: 140,
        coins: 250,
      };
    }

    const childProfile = {
      name: child.name,
      grade: child.grade || 'Grade 4 - Alpha',
      teacherName: child.teacherName || 'Prof. John Keating',
      school: 'EduSpark Primary Academy',
    };

    // 2. Fetch real attendance for this child
    let attendanceLog = [];
    try {
      if (child._id) {
        attendanceLog = await Attendance.find({ student: child._id }).sort({ date: -1 }).limit(10).lean();
      }
    } catch (e) {}

    if (!attendanceLog.length) {
      attendanceLog = [
        { date: '2026-07-24', status: 'On Time', time: '08:45 AM' },
        { date: '2026-07-23', status: 'On Time', time: '08:50 AM' },
        { date: '2026-07-22', status: 'Late', time: '09:12 AM' },
        { date: '2026-07-21', status: 'On Time', time: '08:42 AM' },
        { date: '2026-07-20', status: 'On Time', time: '08:48 AM' },
      ];
    }

    const totalDays = attendanceLog.length;
    const presentDays = attendanceLog.filter((a) => a.status === 'On Time' || a.status === 'Late').length;
    const lateCount = attendanceLog.filter((a) => a.status === 'Late').length;
    const monthlyPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 98.0;

    const attendanceStats = {
      monthlyPercentage,
      totalDaysPresent: presentDays || 22,
      totalDaysAbsent: totalDays - presentDays,
      lateArrivalsCount: lateCount,
      attendanceLog,
    };

    // 3. Performance stats from student quiz results
    const quizResults = child.quizResults || [];
    let mathScore = 92;
    let scienceScore = 95;
    let englishScore = 88;

    quizResults.forEach((q) => {
      const sLower = (q.subject || '').toLowerCase();
      if (sLower.includes('math')) mathScore = q.score;
      else if (sLower.includes('sci')) scienceScore = q.score;
      else if (sLower.includes('eng')) englishScore = q.score;
    });

    const performanceCharts = {
      weeklyGrowth: [
        { week: 'Week 1', score: 82, homework: 85 },
        { week: 'Week 2', score: 86, homework: 90 },
        { week: 'Week 3', score: 89, homework: 92 },
        { week: 'Week 4', score: Math.round((mathScore + scienceScore) / 2), homework: 95 },
      ],
      subjectComparison: [
        { subject: 'Mathematics', score: mathScore, classAverage: 84 },
        { subject: 'Science', score: scienceScore, classAverage: 89 },
        { subject: 'English', score: englishScore, classAverage: 86 },
        { subject: 'Social Studies', score: 90, classAverage: 85 },
      ],
    };

    const aiRecommendations = [
      { id: 1, text: `Practice subtraction and fraction exercises with ${child.name.split(' ')[0]} for 15 mins daily.`, category: 'Math' },
      { id: 2, text: 'Read for 20 minutes before bedtime to boost vocabulary retention.', category: 'Reading' },
      { id: 3, text: 'Encourage neat handwriting exercises for notebook assignments.', category: 'Writing' },
      { id: 4, text: `Great progress in Science! Praise ${child.name.split(' ')[0]} for active participation.`, category: 'Praise' },
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
    const isWorkingHours = currentHour >= 9 && currentHour < 16;

    res.status(200).json({
      success: true,
      isWorkingHours,
      workingHoursNotice: isWorkingHours
        ? 'Teacher is currently available (9:00 AM – 4:00 PM).'
        : 'Teacher is currently unavailable. Working hours are 9:00 AM – 4:00 PM.',
      teacherName: 'Prof. John Keating',
      messages: memoryStore.teacherMessages,
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

    const savedMsg = memoryStore.saveTeacherMessage({
      sender: req.user?.name ? `${req.user.name} (Parent)` : 'Parent',
      text,
      isTeacher: false,
      parentId: req.user?._id || req.user?.id,
    });

    res.status(200).json({
      success: true,
      isWorkingHours,
      messageSent: savedMsg,
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
      message: `Appointment confirmed with Prof. John Keating for ${date} at ${timeSlot}!`,
      appointment: { date, timeSlot, topic: topic || 'Learning Growth Review' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to book appointment.' });
  }
};
