require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const tutorService = require('../services/gemini/aiTutorService');

(async () => {
  try {
    console.log('API KEY Length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
    console.log('API KEY Prefix:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : 'None');
    
    console.log('Sending question: "What is global warming?"');
    const result = await tutorService.askAiTutor({
      question: 'What is global warming?',
      studentClass: 'Grade 4'
    });
    console.log('Success! Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('FAILED with error:');
    console.error(err);
  }
})();
