const jwt = require('jsonwebtoken');
const memoryStore = require('../utils/memoryStore');
const { validateYouTubeUrl, extractYouTubeVideoId } = require('../utils/youtubeValidator');
const homeworkHelper = require('../services/gemini/homeworkHelperService');
const { getTeacherCurriculumOptions, validateTeacherCurriculumSelection } = require('../utils/curriculumData');

async function runTests() {
  console.log('--- TEST 1: YouTube URL Validator & Video ID Extractor ---');
  const valid1 = validateYouTubeUrl('https://www.youtube.com/watch?v=n0FQSx012N8');
  console.log('watch?v URL valid:', valid1.isValid, 'videoId:', valid1.videoId);
  if (!valid1.isValid || valid1.videoId !== 'n0FQSx012N8') throw new Error('Valid watch URL failed');

  const valid2 = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
  console.log('youtu.be URL valid:', valid2.isValid, 'videoId:', valid2.videoId);
  if (!valid2.isValid || valid2.videoId !== 'dQw4w9WgXcQ') throw new Error('Valid youtu.be failed');

  const valid3 = validateYouTubeUrl('https://www.youtube.com/embed/n0FQSx012N8');
  console.log('embed URL valid:', valid3.isValid, 'videoId:', valid3.videoId);

  const invalid1 = validateYouTubeUrl('hello');
  console.log('invalid string "hello":', invalid1.isValid, 'error:', invalid1.error);
  if (invalid1.isValid || invalid1.error !== 'Please enter a valid YouTube video URL.') {
    throw new Error('Invalid URL check failed');
  }

  console.log('\n--- TEST 2: Teacher Curriculum & Assignment Options ---');
  const teacherUser = memoryStore.findByEmail('teacher@eduspark.ai');
  console.log('Found teacher:', teacherUser.name, 'assignedClass:', teacherUser.assignedClass, 'subjects:', teacherUser.subjects);
  const currOptions = getTeacherCurriculumOptions(teacherUser);
  console.log('Assigned classes:', currOptions.assignedClasses);
  console.log('Assigned subjects:', currOptions.assignedSubjects);
  if (!currOptions.assignedClasses.includes('Grade 4 - Alpha') || !currOptions.assignedSubjects.includes('Mathematics')) {
    throw new Error('Teacher curriculum assignment options missing');
  }

  console.log('\n--- TEST 3: Teacher Authorization Checks ---');
  const validAuth = validateTeacherCurriculumSelection(teacherUser, {
    className: 'Grade 4 - Alpha',
    grade: 'Grade 4',
    subject: 'Mathematics',
    chapter: 'Chapter 1: Fractions & Decimals',
    topic: 'Equivalent Fractions',
  });
  console.log('Authorized assignment valid:', validAuth.isValid);
  if (!validAuth.isValid) throw new Error('Valid assignment rejected');

  const unauthSubject = validateTeacherCurriculumSelection(teacherUser, {
    className: 'Grade 4 - Alpha',
    grade: 'Grade 4',
    subject: 'French Language',
    chapter: 'Chapter 1',
    topic: 'Greetings',
  });
  console.log('Unauthorized subject rejected (403):', !unauthSubject.isValid, unauthSubject.status, unauthSubject.message);
  if (unauthSubject.isValid || unauthSubject.status !== 403) throw new Error('Unauthorized subject was not rejected with 403');

  const unauthClass = validateTeacherCurriculumSelection(teacherUser, {
    className: 'Grade 10 - Zeta',
    grade: 'Grade 10',
    subject: 'Mathematics',
    chapter: 'Chapter 1',
    topic: 'Calculus',
  });
  console.log('Unauthorized class rejected (403):', !unauthClass.isValid, unauthClass.status, unauthClass.message);
  if (unauthClass.isValid || unauthClass.status !== 403) throw new Error('Unauthorized class was not rejected with 403');

  console.log('\n--- TEST 4: Add Video and Duplicate Prevention ---');
  const videoData = {
    title: 'Introduction to Fractions',
    description: 'Learn visual fraction models',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    subject: 'Mathematics',
    chapter: 'Chapter 1: Fractions & Decimals',
    topic: 'Basic Fractions',
    youtubeUrl: 'https://www.youtube.com/embed/n0FQSx012N8',
    youtubeVideoId: 'n0FQSx012N8',
    thumbnail: 'https://img.youtube.com/vi/n0FQSx012N8/hqdefault.jpg',
    teacherId: teacherUser.id,
    teacherName: teacherUser.name,
  };

  // Delete any existing with this ID first
  const existingIdx = memoryStore.lessons.findIndex(l => l.youtubeVideoId === 'n0FQSx012N8' && l.topic === 'Basic Fractions');
  if (existingIdx >= 0) memoryStore.lessons.splice(existingIdx, 1);

  const saved = memoryStore.saveLesson(videoData);
  console.log('Saved video in memory store:', saved.id, saved.title, saved.topic);

  // Attempt duplicate save
  let duplicateCaught = false;
  try {
    memoryStore.saveLesson(videoData);
  } catch (dupErr) {
    if (dupErr.code === 'DUPLICATE_VIDEO') {
      duplicateCaught = true;
      console.log('Duplicate prevention caught successfully:', dupErr.message);
    }
  }
  if (!duplicateCaught) throw new Error('Duplicate video was not prevented!');

  console.log('\n--- TEST 5: Update and Delete Video ---');
  const updated = memoryStore.updateLesson(saved.id, { title: 'Advanced Fractions Guide' });
  console.log('Updated video title:', updated.title);
  if (updated.title !== 'Advanced Fractions Guide') throw new Error('Update failed');

  const deleted = memoryStore.deleteLesson(saved.id);
  console.log('Deleted video:', deleted ? 'Success' : 'Failed');
  const verifyDeleted = memoryStore.lessons.find(l => l.id === saved.id);
  if (verifyDeleted) throw new Error('Video still exists after deletion');

  console.log('\n--- TEST 6: AI Homework Helper with Context ---');
  const res1 = await homeworkHelper.solveHomework({
    questionText: 'Find 25% of 80.',
    studentClass: 'Grade 4',
  });
  console.log('Question 1 Answer:', res1.finalAnswer);
  console.log('Steps:', res1.steps);
  if (!res1.finalAnswer.includes('20')) throw new Error('25% of 80 did not calculate 20');

  const res2 = await homeworkHelper.solveHomework({
    questionText: 'Why did you divide by 100?',
    studentClass: 'Grade 4',
    history: [
      { role: 'user', text: 'Find 25% of 80.' },
      { role: 'assistant', text: res1.finalAnswer },
    ],
  });
  console.log('Question 2 (Follow-up) Answer:', res2.finalAnswer);
  console.log('Steps:', res2.steps);

  console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
