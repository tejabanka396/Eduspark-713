require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const http = require('http');

const secret = process.env.JWT_SECRET || 'eduspark_secret_key_2026_super_secure';
const token = jwt.sign({ id: 'demo-student-id-004' }, secret, { expiresIn: '1h' });

const testQuestions = [
  'What is 2 + 2?',
  'multiply 5 and 2',
  'Why do plants need sunlight?',
  'What is the capital of France?',
  'Explain photosynthesis to a Grade 4 student.'
];

const runTestForQuestion = (q) => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      question: q,
      class: 'Grade 4'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/ai/tutor',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n--- Test for Question: "${q}" ---`);
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', body);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Request failed:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

(async () => {
  for (const q of testQuestions) {
    await runTestForQuestion(q);
  }
})();
