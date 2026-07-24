const bcrypt = require('bcryptjs');

const memoryUsers = [];
const memoryClasses = [
  {
    _id: 'class-001',
    id: 'class-001',
    name: 'Grade 4 - Alpha',
    grade: 'Grade 4',
    section: 'A',
    room: 'Room 101',
    teacherName: 'Prof. John Keating',
    capacity: 30,
    studentsCount: 24,
  },
];

const memoryLessons = [
  {
    _id: 'lesson-001',
    id: 'lesson-001',
    title: 'Understanding Equivalent Fractions',
    description: 'Learn how to visualize and calculate equivalent fractions with fun pie diagrams.',
    grade: 'Grade 4',
    subject: 'Mathematics',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/embed/n0FQSx012N8',
    teacherName: 'Prof. John Keating',
    createdAt: new Date(),
  },
  {
    _id: 'lesson-002',
    id: 'lesson-002',
    title: 'Photosynthesis & Plant Life Cycle',
    description: 'Weekly concept covering how green plants produce oxygen and food from sunlight.',
    grade: 'Grade 4',
    subject: 'Science',
    category: 'weekly',
    contentType: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    teacherName: 'Prof. John Keating',
    createdAt: new Date(),
  },
];

const memoryHomeworks = [
  {
    _id: 'hw-001',
    id: 'hw-001',
    title: 'Fractions Practice Sheet #3',
    description: 'Solve problems 1 through 10 on page 42 of your workbook or upload your notebook picture.',
    grade: 'Grade 4',
    subject: 'Mathematics',
    dueDate: '2026-07-28',
    totalMarks: 100,
    teacherName: 'Prof. John Keating',
    submissions: [
      {
        _id: 'sub-001',
        id: 'sub-001',
        studentId: 'demo-student-id-004',
        studentName: 'Leo Vance',
        content: 'I completed all 10 problems on equivalent fractions. 1/2 = 2/4 = 4/8.',
        submittedAt: new Date(),
        marksObtained: 95,
        feedback: 'Excellent work Leo! Very clear steps.',
        status: 'graded',
      },
    ],
  },
];

const memoryQuizzes = [
  {
    _id: 'quiz-001',
    id: 'quiz-001',
    title: 'Grade 4 Math - Fractions & Decimals Quiz',
    grade: 'Grade 4',
    subject: 'Mathematics',
    topic: 'Fractions & Decimals',
    difficulty: 'Medium',
    questions: [
      {
        question: 'Which of the following is equivalent to 1/2?',
        type: 'mcq',
        options: ['2/4', '3/8', '1/3', '4/5'],
        correctAnswer: '2/4',
        explanation: 'Multiply both numerator and denominator by 2.',
      },
      {
        question: 'True or False: 0.5 is equal to 1/2.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: '0.5 expressed as a fraction is 5/10 which simplifies to 1/2.',
      },
      {
        question: 'What is 3/4 + 1/4?',
        type: 'fill_blank',
        options: [],
        correctAnswer: '1',
        explanation: '3/4 + 1/4 = 4/4 = 1.',
      },
    ],
    isPublished: true,
  },
];

const memoryAchievements = [
  { id: 'ach-1', title: '5-Day Streak Master', description: 'Logged in and completed learning 5 days in a row!', icon: '🔥', starsReward: 50, coinsReward: 100, unlocked: true },
  { id: 'ach-2', title: 'Fraction Explorer', description: 'Scored over 90% on Fractions & Decimals Quiz', icon: '⭐', starsReward: 30, coinsReward: 60, unlocked: true },
  { id: 'ach-3', title: 'Bookworm Junior', description: 'Bookmarked and completed 5 core subject lessons', icon: '📚', starsReward: 20, coinsReward: 40, unlocked: true },
  { id: 'ach-4', title: 'AI Curiosity Star', description: 'Asked 3 guided questions to the AI Tutor', icon: '🤖', starsReward: 25, coinsReward: 50, unlocked: false },
];

const memoryBookmarks = ['lesson-001'];

const initDemoUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  const demoAccounts = [
    {
      _id: 'demo-admin-id-001',
      id: 'demo-admin-id-001',
      name: 'Dr. Sarah Connor',
      email: 'admin@eduspark.ai',
      password: defaultPasswordHash,
      role: 'admin',
      isVerified: true,
    },
    {
      _id: 'demo-teacher-id-002',
      id: 'demo-teacher-id-002',
      name: 'Prof. John Keating',
      email: 'teacher@eduspark.ai',
      password: defaultPasswordHash,
      role: 'teacher',
      isVerified: true,
    },
    {
      _id: 'demo-parent-id-003',
      id: 'demo-parent-id-003',
      name: 'Eleanor Vance',
      email: 'parent@eduspark.ai',
      password: defaultPasswordHash,
      role: 'parent',
      isVerified: true,
    },
    {
      _id: 'demo-student-id-004',
      id: 'demo-student-id-004',
      name: 'Leo Vance',
      email: 'student@eduspark.ai',
      password: defaultPasswordHash,
      role: 'student',
      isVerified: true,
      grade: 'Grade 4',
      stars: 140,
      coins: 250,
      streak: 5,
    },
  ];

  demoAccounts.forEach((acc) => {
    if (!memoryUsers.find((u) => u.email === acc.email)) {
      memoryUsers.push(acc);
    }
  });
};

initDemoUsers();

module.exports = {
  users: memoryUsers,
  classes: memoryClasses,
  lessons: memoryLessons,
  homeworks: memoryHomeworks,
  quizzes: memoryQuizzes,
  achievements: memoryAchievements,
  bookmarks: memoryBookmarks,
  findByEmail: (email) => memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id) => memoryUsers.find((u) => u.id === id || u._id === id),
  findByRole: (role) => memoryUsers.filter((u) => u.role === role),
  saveUser: (userData) => {
    const existingIndex = memoryUsers.findIndex((u) => (userData.id && u.id === userData.id) || u.email === userData.email);
    if (existingIndex >= 0) {
      memoryUsers[existingIndex] = { ...memoryUsers[existingIndex], ...userData };
      return memoryUsers[existingIndex];
    }
    const id = userData.id || 'mem-' + Date.now();
    const newUser = { _id: id, id, ...userData };
    memoryUsers.push(newUser);
    return newUser;
  },
  deleteUser: (id) => {
    const index = memoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (index >= 0) return memoryUsers.splice(index, 1)[0];
    return null;
  },
  toggleBookmark: (lessonId) => {
    const index = memoryBookmarks.indexOf(lessonId);
    if (index >= 0) {
      memoryBookmarks.splice(index, 1);
      return false; // unbookmarked
    } else {
      memoryBookmarks.push(lessonId);
      return true; // bookmarked
    }
  },
  addHomeworkSubmission: (hwId, submissionData) => {
    const hw = memoryHomeworks.find((h) => h.id === hwId || h._id === hwId);
    if (hw) {
      const newSub = {
        _id: 'sub-' + Date.now(),
        id: 'sub-' + Date.now(),
        submittedAt: new Date(),
        status: 'submitted',
        marksObtained: 0,
        feedback: '',
        ...submissionData,
      };
      hw.submissions = hw.submissions || [];
      hw.submissions.push(newSub);
      return newSub;
    }
    return null;
  },
};
