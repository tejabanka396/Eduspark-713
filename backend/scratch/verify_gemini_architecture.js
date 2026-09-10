const http = require('http');

const runTest = (name, endpoint, body) => {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer test-token' // Auth is bypassed or mock token if protect middleware checks it
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200 && json.success) {
            console.log(`✅ ${name} test passed.`);
            resolve(true);
          } else {
            console.error(`❌ ${name} test failed. Status: ${res.statusCode}, Message: ${json.message || body}`);
            resolve(false);
          }
        } catch (e) {
          console.error(`❌ ${name} test failed. Error parsing JSON response.`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ ${name} test failed. Error: ${e.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

const verifyArchitecture = async () => {
  console.log('Starting Gemini Architecture Verification...');

  // Since auth is enabled, we'll actually test the service layer directly to bypass auth token requirement
  // unless we mock a token. Let's just require the controller functions directly with mock req/res.
  
  const aiController = require('../controllers/aiController');
  
  const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
  };
  
  // 1. Test AI Tutor
  const resTutor = mockRes();
  await aiController.handleAiTutor({ body: { question: 'What is photosynthesis?', subject: 'Science', class: 'Grade 5' }, user: { id: 'u1' } }, resTutor);
  if (resTutor.statusCode === 200 && resTutor.data.success) {
    console.log('✅ AI Tutor passed');
  } else {
    console.error('❌ AI Tutor failed');
  }

  // 2. Test Homework Helper
  const resHw = mockRes();
  await aiController.handleHomeworkHelper({ body: { questionText: 'Solve 2x + 4 = 10', subject: 'Math', class: 'Grade 8' } }, resHw);
  if (resHw.statusCode === 200 && resHw.data.success) {
    console.log('✅ Homework Helper passed');
  } else {
    console.error('❌ Homework Helper failed');
  }

  // 3. Test Quiz Generator
  const resQuiz = mockRes();
  await aiController.handleQuizGenerate({ body: { subject: 'History', topic: 'French Revolution', numberOfQuestions: 2 } }, resQuiz);
  if (resQuiz.statusCode === 200 && resQuiz.data.success) {
    console.log('✅ Quiz Generator passed');
  } else {
    console.error('❌ Quiz Generator failed');
  }

  // 4. Test OCR Scan (Multimodal text)
  const resOcr = mockRes();
  await aiController.handleOcrScan({ body: { imageDataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' } }, resOcr);
  if (resOcr.statusCode === 200 && resOcr.data.success) {
    console.log('✅ OCR Scanner passed');
  } else {
    console.error('❌ OCR Scanner failed');
  }

  // 5. Test Teacher Content Analyzer
  const resContent = mockRes();
  await aiController.handleContentAnalyze({ body: { contentText: 'The periodic table has 118 elements.' } }, resContent);
  if (resContent.statusCode === 200 && resContent.data.success) {
    console.log('✅ Teacher Content Analyzer passed');
  } else {
    console.error('❌ Teacher Content Analyzer failed');
  }

  // 6. Test Student Insights
  const resStudentInsights = mockRes();
  await aiController.handleStudentInsights({ body: { stats: { quizAverage: 75 } } }, resStudentInsights);
  if (resStudentInsights.statusCode === 200 && resStudentInsights.data.success) {
    console.log('✅ Student Insights passed');
  } else {
    console.error('❌ Student Insights failed');
  }

  // 7. Test Teacher Insights
  const resTeacherInsights = mockRes();
  await aiController.handleTeacherInsights({ body: { stats: { classAverage: 82 } } }, resTeacherInsights);
  if (resTeacherInsights.statusCode === 200 && resTeacherInsights.data.success) {
    console.log('✅ Teacher Insights passed');
  } else {
    console.error('❌ Teacher Insights failed');
  }
};

// Handle env vars to ensure we pick up the key
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
verifyArchitecture();
