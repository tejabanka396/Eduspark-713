const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY environment variable. Set it in your .env file before running this script.');
  process.exit(1);
}

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 400) {
      console.log('Error fetching models:', res.statusCode, data);
    } else {
      try {
        const json = JSON.parse(data);
        console.log('Available Models:');
        json.models.forEach(m => {
          if (m.supportedGenerationMethods.includes('generateContent')) {
            console.log(`- ${m.name}`);
          }
        });
      } catch (e) {
        console.log('Error parsing response:', e);
      }
    }
  });
}).on('error', (err) => {
  console.log('Request Error:', err.message);
});
