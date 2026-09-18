/**
 * Comprehensive End-to-End Verification of EduSpark Fixes
 */
const { validateYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } = require('../utils/youtubeValidator');
const curriculumData = require('../utils/curriculumData');
const memoryStore = require('../utils/memoryStore');
const homeworkHelper = require('../services/gemini/homeworkHelperService');
const quizGenerator = require('../services/gemini/quizGeneratorService');

async function runAllVerifications() {
  console.log('=== STARTING EDUSPARK COMPREHENSIVE VERIFICATION ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ----------------------------------------------------
  // TEST 1: YouTube URL Validator (All 4 formats + rejection)
  // ----------------------------------------------------
  console.log('--- TEST 1: YouTube URL Validator ---');
  const urls = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expectedId: 'dQw4w9WgXcQ' },
  ];

  for (const item of urls) {
    const res = validateYouTubeUrl(item.url);
    assert(res.isValid && res.videoId === item.expectedId, `Validates ${item.url} -> ID: ${res.videoId}`);
  }

  const invalidRes = validateYouTubeUrl('https://vimeo.com/123456');
  assert(!invalidRes.isValid && invalidRes.error === 'Please enter a valid YouTube video URL.', 'Rejects non-YouTube URL with exact specified message');

  // ----------------------------------------------------
  // TEST 2: Curriculum Structure & Teacher Permissions
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Curriculum Structure & Permissions ---');
  const teacherUser = {
    _id: 'demo-teacher-id-002',
    role: 'teacher',
    subjects: ['Mathematics', 'Science'],
    grades: ['Grade 4'],
    assignedClasses: ['Grade 4 - Alpha'],
  };

  const teacherCurriculum = curriculumData.getTeacherCurriculumOptions(teacherUser);
  assert(teacherCurriculum.assignedClasses.includes('Grade 4 - Alpha'), 'Teacher has Grade 4 - Alpha in assigned classes');
  assert(teacherCurriculum.assignedSubjects.includes('Mathematics') && teacherCurriculum.assignedSubjects.includes('Science'), 'Teacher has Mathematics and Science');
  assert(!teacherCurriculum.assignedSubjects.includes('Social Studies'), 'Teacher does NOT have unassigned subject Social Studies');

  const authMath = curriculumData.validateTeacherCurriculumSelection(teacherUser, {
    grade: 'Grade 4',
    subject: 'Mathematics',
    chapter: 'Fractions & Decimals',
    topic: 'Equivalent Fractions',
  });
  assert(authMath.isValid, 'Authorized for Grade 4 Mathematics / Fractions / Equivalent Fractions');

  const authUnassigned = curriculumData.validateTeacherCurriculumSelection(teacherUser, {
    grade: 'Grade 4',
    subject: 'Social Studies',
    chapter: 'Geography & Maps',
    topic: 'Continents and Oceans',
  });
  assert(!authUnassigned.isValid && authUnassigned.status === 403, 'Unauthorized subject returns 403 Forbidden');

  // ----------------------------------------------------
  // TEST 3: YouTube Video Lifecycle (Create -> Read -> Update -> Duplicate Prevention -> Delete)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: YouTube Video CRUD & Duplicate Check ---');
  
  // Create
  const newVideo = {
    title: 'Understanding Equivalent Fractions with Visual Models',
    description: 'Learn how 1/2 equals 2/4 and 4/8 using fraction bars.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    subject: 'Mathematics',
    category: 'Mathematics',
    chapter: 'Fractions & Decimals',
    topic: 'Equivalent Fractions',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeVideoId: 'dQw4w9WgXcQ',
    thumbnail: getYouTubeThumbnailUrl('dQw4w9WgXcQ'),
    author: teacherUser._id,
    authorName: 'Prof. John Keating',
  };

  const savedVideo = memoryStore.saveLesson(newVideo);
  assert(savedVideo && savedVideo.id, 'Created new YouTube video lesson in store');
  assert(savedVideo.youtubeVideoId === 'dQw4w9WgXcQ', 'Stores exact YouTube video ID');
  assert(savedVideo.chapter === 'Fractions & Decimals', 'Stores chapter field');
  assert(savedVideo.topic === 'Equivalent Fractions', 'Stores topic field');

  // Duplicate Check
  let duplicateThrew = false;
  try {
    memoryStore.saveLesson({
      ...newVideo,
      title: 'Another video for same topic',
    });
  } catch (err) {
    duplicateThrew = true;
    assert(err.message.includes('already'), 'Duplicate prevented for Class + Subject + Chapter + Topic');
  }
  assert(duplicateThrew, 'Duplicate save threw expected error');

  // Student Visibility Check
  const studentLessons = (memoryStore.lessons || []).filter(
    (l) => (l.grade || '').toLowerCase() === 'grade 4' || (l.className || '').toLowerCase() === 'grade 4 - alpha'
  );
  const foundInStudentView = studentLessons.some((l) => l.id === savedVideo.id);
  assert(foundInStudentView, 'Saved video is immediately visible in student dashboard for Grade 4');

  // Update
  const updatedVideo = memoryStore.updateLesson(savedVideo.id, {
    title: 'Visualizing Fractions Like a Pro (Updated)',
    description: 'Updated comprehensive fraction walkthrough.',
  });
  assert(updatedVideo && updatedVideo.title.includes('Updated'), 'Updated video title successfully');

  // Delete
  const deleteResult = memoryStore.deleteLesson(savedVideo.id);
  assert(Boolean(deleteResult), 'Deleted video successfully');

  // Confirm Deletion
  const postDeleteLessons = (memoryStore.lessons || []).filter((l) => l.id === savedVideo.id);
  assert(postDeleteLessons.length === 0, 'Confirmed video no longer exists in store/database');

  // ----------------------------------------------------
  // TEST 4: AI Homework Helper with Conversational Context
  // ----------------------------------------------------
  console.log('\n--- TEST 4: AI Homework Helper Context & Step-by-Step ---');
  
  // Turn 1: "Find 25% of 80."
  const turn1Result = await homeworkHelper.solveHomework({
    questionText: 'Find 25% of 80.',
    studentClass: 'Grade 4',
    subject: 'Mathematics',
  });
  
  assert(turn1Result.understandTheQuestion && turn1Result.understandTheQuestion.length > 0, 'Includes "understandTheQuestion"');
  assert(Array.isArray(turn1Result.steps) && turn1Result.steps.length >= 3, 'Includes at least 3 distinct calculation steps');
  assert(turn1Result.finalAnswer.includes('20'), `Calculates exact answer 20 for 25% of 80 (Got: ${turn1Result.finalAnswer})`);
  assert(turn1Result.quickTip && turn1Result.quickTip.length > 0, 'Includes "quickTip" educational tip');

  // Turn 2: Follow-up question with history: "Why did you divide by 100?"
  const turn2Result = await homeworkHelper.solveHomework({
    questionText: 'Why did you divide by 100?',
    studentClass: 'Grade 4',
    subject: 'Mathematics',
    history: [
      { role: 'user', text: 'Find 25% of 80.' },
      { role: 'assistant', text: turn1Result.finalAnswer },
    ],
  });

  assert(
    turn2Result.understandTheQuestion.toLowerCase().includes('100') ||
    turn2Result.finalAnswer.toLowerCase().includes('100') ||
    turn2Result.steps.some((s) => s.toLowerCase().includes('percent') || s.toLowerCase().includes('100')),
    'Maintains conversational context explaining why we divide by 100 for percentages'
  );

  // ----------------------------------------------------
  // TEST 5: AI Quiz Generator & Deduplication
  // ----------------------------------------------------
  console.log('\n--- TEST 5: AI Quiz Generator & Deduplication ---');
  
  const quizPayload = {
    subject: 'Mathematics',
    grade: 'Grade 4',
    chapter: 'Fractions & Decimals',
    topic: 'Fractions',
    difficulty: 'medium',
    numQuestions: 2,
    teacherId: teacherUser._id,
  };

  const quizGen1 = await quizGenerator.generateQuiz(quizPayload);
  assert(quizGen1 && quizGen1.title, `Generated Math Quiz: "${quizGen1.title}"`);
  assert(Array.isArray(quizGen1.questions) && quizGen1.questions.length > 0, 'Questions returned in structured format');
  assert(
    quizGen1.questions.every((q) => q.question && Array.isArray(q.options) && q.correctAnswer),
    'Every question validated with question text, options, and correct answer'
  );

  // ----------------------------------------------------
  // TEST 6: Real Admin Statistics
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Real Admin DB Statistics ---');
  const teachersCount = memoryStore.users.filter((u) => u.role === 'teacher').length;
  const studentsCount = memoryStore.users.filter((u) => u.role === 'student').length;
  const parentsCount = memoryStore.users.filter((u) => u.role === 'parent').length;
  const classesCount = memoryStore.classes.length;

  assert(teachersCount > 0, `Real Teachers Count: ${teachersCount}`);
  assert(studentsCount > 0, `Real Students Count: ${studentsCount}`);
  assert(parentsCount > 0, `Real Parents Count: ${parentsCount}`);
  assert(classesCount > 0, `Real Classes Count: ${classesCount}`);

  console.log(`\n=== VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED ===`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL EDUSPARK SYSTEM CHECKS PASSED PERFECTLY!');
  }
}

runAllVerifications().catch((err) => {
  console.error('Verification failed with uncaught exception:', err);
  process.exit(1);
});
