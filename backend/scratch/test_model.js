const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable. Set it in your .env file before running this script.');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hello");
      console.log(`✅ Success with ${m}:`, result.response.text());
      return;
    } catch (e) {
      console.log(`❌ Failed with ${m}:`, e.message);
    }
  }
}

test();
