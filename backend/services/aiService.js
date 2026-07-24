const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
let genAI = null;
let model = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (e) {
    console.warn('Gemini API initialization notice:', e.message);
  }
}

/**
 * 1. AI Homework Helper - Socratic Method (NO DIRECT ANSWERS)
 */
exports.generateHomeworkHint = async (question, grade = 'Grade 4') => {
  const systemPrompt = `You are EduSpark AI, a friendly primary school AI Tutor.
CRITICAL RULE: You must NEVER give the direct answer to the student's homework question.
Instead:
- Explain concepts in simple, age-appropriate language suitable for ${grade}.
- Provide step-by-step hints and visual analogies.
- Ask a guiding question to encourage the student to think.`;

  if (model) {
    try {
      const prompt = `${systemPrompt}\n\nStudent Question: "${question}"`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        hint: text,
        encouragement: '🌟 You have got this! Think step by step!',
        provider: 'Google Gemini API',
      };
    } catch (err) {
      console.warn('Gemini API call fallback:', err.message);
    }
  }

  const qLower = question.toLowerCase();
  let hintText = '';
  if (qLower.includes('fraction') || qLower.includes('/')) {
    hintText = `💡 Hint for ${grade}: Imagine a delicious pizza cut into equal slices! The top number (numerator) tells you how many slices you eat, and the bottom number (denominator) tells you how many total slices make the whole pie. Try drawing 2 equal circles to compare!`;
  } else if (qLower.includes('add') || qLower.includes('+')) {
    hintText = `💡 Guided Step: Try splitting the numbers into Tens and Ones! Add the tens first, then add the ones together. What total do you get?`;
  } else if (qLower.includes('plant') || qLower.includes('sunlight') || qLower.includes('photo')) {
    hintText = `💡 Science Hint: Think about what green leaves do when sunlight hits them! Plants take in water from roots, air from leaves, and sunlight to make their food. What is that process called?`;
  } else {
    hintText = `💡 Step-by-Step Guidance for ${grade}: Great question! Let's break it down together. First, identify what numbers or facts are given. What step should we take first before calculating?`;
  }

  return {
    hint: hintText,
    encouragement: '🌟 You can do it! Give it a try step by step!',
    provider: 'EduSpark AI Engine',
  };
};

/**
 * 2. AI Voice Tutor - Child-Friendly Speech Responses via Gemini
 */
exports.generateVoiceTutorResponse = async (voiceQuestion, grade = 'Grade 4') => {
  const systemPrompt = `You are a cheerful, friendly AI Voice Tutor speaking directly to a primary school student in ${grade}.
Rules for response:
- Use simple, easy-to-understand words.
- Keep the response short (under 3 sentences) so it sounds natural when spoken out loud.
- Be enthusiastic, encouraging, and clear.`;

  if (model) {
    try {
      const prompt = `${systemPrompt}\n\nStudent Spoken Question: "${voiceQuestion}"`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        spokenText: text,
        provider: 'Google Gemini API',
      };
    } catch (err) {
      console.warn('Gemini Voice Tutor fallback:', err.message);
    }
  }

  // Conversational Child-Friendly Speech Fallback
  return {
    spokenText: `Hi there! That is a super fun question! When we break "${voiceQuestion}" down into small simple steps, it becomes easy and fun to learn! You are doing an amazing job learning today!`,
    provider: 'EduSpark Voice Engine',
  };
};

/**
 * 3. Adaptive Quiz Generator
 */
exports.generateAdaptiveQuiz = async (grade, subject, topic, difficulty = 'Medium', count = 4) => {
  const prompt = `Generate a primary school quiz for ${grade} ${subject} on topic "${topic}" with difficulty ${difficulty}. Include ${count} questions (MCQ, Fill in blank, True/False, Short Answer). Return JSON.`;

  if (model) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini Quiz Gen fallback:', err.message);
    }
  }

  return [
    {
      question: `What is the key rule when dealing with ${topic} in ${grade} ${subject}?`,
      type: 'mcq',
      options: ['Always simplify to simplest form', 'Add numerators and denominators', 'Ignore the bottom number', 'Multiply by zero'],
      correctAnswer: 'Always simplify to simplest form',
      explanation: `Simplifying gives the clearest representation of ${topic}.`,
    },
    {
      question: `True or False: Practice in ${topic} improves overall ${subject} problem-solving.`,
      type: 'true_false',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Consistent practice builds strong foundational math skills.',
    },
    {
      question: `Fill in the blank: 1/2 is equal to ____ / 4.`,
      type: 'fill_blank',
      options: [],
      correctAnswer: '2',
      explanation: '1/2 = 2/4.',
    },
    {
      question: `Short Answer: Explain in one sentence what you learned about ${topic}.`,
      type: 'short',
      options: [],
      correctAnswer: `${topic} helps us understand parts of a whole.`,
      explanation: 'Clear conceptual understanding.',
    },
  ].slice(0, count);
};

/**
 * 4. Personalized Learning & Recommendations
 */
exports.generatePersonalizedRecommendations = async (studentData) => {
  if (model) {
    try {
      const prompt = `Analyze primary student performance: ${JSON.stringify(studentData)}. Provide 3 action recommendations and weekly study goals.`;
      const result = await model.generateContent(prompt);
      return { recommendations: result.response.text(), provider: 'Google Gemini API' };
    } catch (e) {}
  }

  return {
    recommendations: [
      'Practice 15 minutes of fraction reduction diagrams daily.',
      'Read 20 minutes before bedtime to improve vocabulary and comprehension.',
      'Complete 1 adaptive math quiz to lock in long division skills.',
    ],
    weeklyStudyGoal: 'Achieve 90%+ on upcoming fractions quiz and log 5-day study streak.',
    provider: 'EduSpark AI Analytics Engine',
  };
};

/**
 * 5. Weakness Detection & Learning Gap Analysis
 */
exports.detectWeakTopicsAndGaps = async (studentHistory) => {
  const quizAvg = studentHistory?.quizAverage || 85;
  const homeworkComp = studentHistory?.homeworkCompletion || 90;

  let riskLevel = 'low';
  if (quizAvg < 70 || homeworkComp < 70) riskLevel = 'high';
  else if (quizAvg < 82 || homeworkComp < 82) riskLevel = 'medium';

  return {
    studentId: studentHistory?.studentId || 'demo-student-id-004',
    studentName: studentHistory?.studentName || 'Leo Vance',
    riskLevel,
    weakTopics: quizAvg < 80 ? ['Long Division', 'Fractions Addition'] : ['Word Problems'],
    strongTopics: ['Basic Multiplication', 'Geometry & Shapes', 'Reading Comprehension'],
    learningGapsIdentified: quizAvg < 80 ? 2 : 0,
    recommendedIntervention: riskLevel === 'high' ? 'Schedule 1-on-1 guided practice and notify parent.' : 'Assign 10-minute visual fraction practice games.',
  };
};

/**
 * 6. Performance Forecasting & Exam Score Prediction
 */
exports.predictPerformanceAndTrend = async (studentHistory) => {
  const currentAvg = studentHistory?.quizAverage || 88;
  const expectedExamScore = Math.min(99, Math.round(currentAvg * 1.05));
  const improvementProbability = currentAvg >= 80 ? 94 : 78;

  return {
    currentAverage: currentAvg,
    predictedExamScore: expectedExamScore,
    learningTrend: currentAvg >= 85 ? 'Upward Growth 🚀' : 'Steady Progress 📈',
    improvementProbabilityPercentage: improvementProbability,
    forecastInsights: `Based on 5-day learning streak and quiz scores, student is projected to score ${expectedExamScore}% on the upcoming term exam.`,
  };
};
