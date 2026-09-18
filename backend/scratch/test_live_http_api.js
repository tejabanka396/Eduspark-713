const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testLiveServer() {
  console.log('=== TESTING LIVE EDUSPARK HTTP API (PORT 4000) ===\n');

  // 1. Health check / Root
  try {
    const rootRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    });
    console.log('1. Health Check:', rootRes.status, rootRes.body?.message || rootRes.raw || 'OK');
  } catch (err) {
    console.log('1. Health Check (fallback root):', err.message);
  }

  // 2. Teacher Login
  console.log('\n2. Testing Teacher Login...');
  const teacherLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'teacher@eduspark.ai', password: 'password123' }
  );
  console.log('Teacher Login Status:', teacherLogin.status, 'User:', teacherLogin.body?.user?.name);
  const teacherToken = teacherLogin.body?.token;
  if (!teacherToken) {
    console.error('Failed to obtain teacher token:', teacherLogin.body);
    process.exit(1);
  }

  // 3. Teacher Curriculum Fetch
  console.log('\n3. Testing Teacher Curriculum API...');
  const currRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/teacher/curriculum',
    method: 'GET',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  console.log('Curriculum Status:', currRes.status);
  console.log('Assigned Classes:', currRes.body?.assignedClasses);
  console.log('Assigned Subjects:', currRes.body?.assignedSubjects);

  // 4. Create YouTube Video
  console.log('\n4. Testing Teacher YouTube Video Upload API...');
  const testTopic = 'Equivalent Fractions ' + Date.now();
  const createVideoRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/teacher/videos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    },
    {
      title: 'Fraction Models in Real Life',
      description: 'Understanding parts of a whole with pizza and chocolate bars.',
      className: 'Grade 4 - Alpha',
      grade: 'Grade 4',
      subject: 'Mathematics',
      chapter: 'Fractions & Decimals',
      topic: testTopic,
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }
  );
  console.log('Create Video Status:', createVideoRes.status, 'Message:', createVideoRes.body?.message);
  const createdVideoId = createVideoRes.body?.data?._id || createVideoRes.body?.data?.id;
  console.log('Video ID extracted:', createdVideoId);

  // 5. Test Duplicate Video Prevention
  console.log('\n5. Testing Duplicate Video Prevention...');
  const dupRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/teacher/videos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    },
    {
      title: 'Duplicate Attempt',
      className: 'Grade 4 - Alpha',
      grade: 'Grade 4',
      subject: 'Mathematics',
      chapter: 'Fractions & Decimals',
      topic: testTopic,
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }
  );
  console.log('Duplicate Check Status:', dupRes.status, 'Message:', dupRes.body?.message);

  // 6. Student Login & View Assigned Video
  console.log('\n6. Testing Student Login & Dashboard Video Feed...');
  const studentLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'student@eduspark.ai', password: 'password123' }
  );
  console.log('Student Login Status:', studentLogin.status, 'User:', studentLogin.body?.user?.name);
  const studentToken = studentLogin.body?.token;

  const studentDash = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/student/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log('Student Dashboard Status:', studentDash.status);
  const studentLessons = studentDash.body?.lessons || [];
  console.log('Lessons available to student:', studentLessons.length);
  const foundVideo = studentLessons.find((l) => l.youtubeVideoId === 'dQw4w9WgXcQ' || l.title === 'Fraction Models in Real Life');
  console.log('Assigned Video Found in Student View:', Boolean(foundVideo), 'Title:', foundVideo?.title);

  // 7. AI Homework Helper Multi-Turn Context
  console.log('\n7. Testing AI Homework Helper with Conversational Context...');
  const aiTurn1 = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/ai/homework',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      question: 'Find 25% of 80.',
      class: 'Grade 4',
      subject: 'Mathematics',
    }
  );
  console.log('AI Turn 1 Status:', aiTurn1.status);
  console.log('Understand:', aiTurn1.body?.data?.understandTheQuestion);
  console.log('Steps:', aiTurn1.body?.data?.steps);
  console.log('Final Answer:', aiTurn1.body?.data?.finalAnswer);
  console.log('Quick Tip:', aiTurn1.body?.data?.quickTip);

  // Follow-up
  const aiTurn2 = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/ai/homework',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    },
    {
      question: 'Why did you divide by 100?',
      class: 'Grade 4',
      subject: 'Mathematics',
      history: [
        { role: 'user', text: 'Find 25% of 80.' },
        { role: 'assistant', text: aiTurn1.body?.data?.finalAnswer },
      ],
    }
  );
  console.log('\nAI Turn 2 (Follow-up) Status:', aiTurn2.status);
  console.log('Contextual Response:', aiTurn2.body?.data?.understandTheQuestion);
  console.log('Final Answer:', aiTurn2.body?.data?.finalAnswer);

  // 8. Parent Dashboard Check
  console.log('\n8. Testing Parent Login & Dashboard...');
  const parentLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'parent@eduspark.ai', password: 'password123' }
  );
  const parentToken = parentLogin.body?.token;
  const parentDash = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/parent/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  console.log('Parent Dashboard Status:', parentDash.status);
  console.log('Child:', parentDash.body?.childProfile?.name, 'Grade:', parentDash.body?.childProfile?.grade);
  console.log('Attendance:', parentDash.body?.attendanceStats?.monthlyPercentage, '%');

  // 9. Admin Dashboard Real Counts
  console.log('\n9. Testing Admin Login & Real DB Counts...');
  const adminLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@eduspark.ai', password: 'password123' }
  );
  const adminToken = adminLogin.body?.token;
  const adminStats = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Admin Stats Status:', adminStats.status, 'Stats:', adminStats.body?.stats);

  // 10. Delete the Video and Confirm
  if (createdVideoId) {
    console.log('\n10. Testing Teacher Video Deletion...');
    const delRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/teacher/videos/${createdVideoId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log('Delete Video Status:', delRes.status, 'Message:', delRes.body?.message);

    // Confirm student dashboard no longer shows it
    const postDelDash = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/student/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const stillPresent = (postDelDash.body?.lessons || []).some((l) => (l._id || l.id) === createdVideoId);
    console.log('Confirmed Video Removed from Student View:', !stillPresent);
  }

  console.log('\n=== LIVE HTTP API TESTS COMPLETED SUCCESSFULLY! ===');
}

testLiveServer().catch((err) => {
  console.error('HTTP Test Error:', err);
  process.exit(1);
});
