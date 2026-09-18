const geminiClient = require('./geminiClient');
const Quiz = require('../../models/Quiz'); // Or just use Quiz to fetch existing if possible, but let's avoid DB calls in service if we can just pass them. Wait, we can fetch here.

/**
 * Validates a single generated question to ensure it matches required formats.
 */
const validateQuestion = (q, expectedType) => {
  if (!q || !q.question || !q.type || !q.correctAnswer) return false;
  
  // Enforce requested type if specific
  if (expectedType !== 'mixed' && q.type !== expectedType) {
    q.type = expectedType;
  }

  // Ensure options array exists for MCQ
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (!q.options.includes(q.correctAnswer)) {
      q.options.push(q.correctAnswer); // Auto-fix
    }
  }

  if (q.type === 'true_false') {
    q.options = ['True', 'False'];
    const lowerAns = q.correctAnswer.trim().toLowerCase();
    q.correctAnswer = lowerAns === 'true' ? 'True' : 'False';
  }

  if (!q.options) q.options = [];
  if (!q.explanation) q.explanation = 'No explanation provided.';

  return true;
};

/**
 * Simple string distance/similarity to prevent duplicates
 */
const isDuplicate = (newQuestionText, existingList) => {
  if (!newQuestionText) return true;
  const normalizedNew = newQuestionText.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const existing of existingList) {
    const normalizedExisting = existing.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedNew === normalizedExisting || normalizedNew.includes(normalizedExisting) || normalizedExisting.includes(normalizedNew)) {
      return true; // Too similar
    }
  }
  return false;
};

exports.generateQuiz = async (params) => {
  const studentClass = params?.class || params?.grade || 'Grade 4';
  const {
    subject = 'Mathematics',
    chapter = 'Chapter 1',
    topic = 'General Topic',
    difficulty = 'Medium',
    questionType = 'mixed',
    numberOfQuestions = 4,
    sourceMaterialText = '',
    sourceMaterialName = '',
  } = params || {};

  // 1. Fetch last 20 questions from DB or memoryStore for deduplication context
  let existingQuestions = [];
  try {
    const recentQuizzes = await Quiz.find({ subject, topic }).sort({ createdAt: -1 }).limit(5).lean();
    for (const qz of recentQuizzes) {
      if (qz.questions) {
        existingQuestions.push(...qz.questions);
      }
    }
  } catch (err) {
    // fallback to memoryStore
  }

  if (existingQuestions.length === 0) {
    const memoryStore = require('../../utils/memoryStore');
    const recentMem = (memoryStore.quizzes || [])
      .filter((q) => (!subject || q.subject === subject) && (!topic || q.topic === topic))
      .slice(0, 5);
    for (const qz of recentMem) {
      if (qz.questions) {
        existingQuestions.push(...qz.questions);
      }
    }
  }

  // 2. Build Subject Specific Prompt
  let subjectRules = '';
  const sUpper = subject.toUpperCase();
  if (sUpper.includes('MATH') || sUpper.includes('ALGEBRA') || sUpper.includes('GEOMETRY')) {
    subjectRules = `\nSUBJECT SPECIFIC RULE (MATHEMATICS):\n- Generate pure math problems: calculations, equations, numerical operations, fractions, geometry, word problems.\n- DO NOT generate questions about biology, history, or grammar.`;
  } else if (sUpper.includes('SCI') || sUpper.includes('BIO') || sUpper.includes('PHYSIC') || sUpper.includes('CHEM')) {
    subjectRules = `\nSUBJECT SPECIFIC RULE (SCIENCE):\n- Generate science concepts: organisms, environment, forces, energy, matter, scientific method.\n- DO NOT generate unrelated math equations or literary analysis.`;
  } else if (sUpper.includes('ENG') || sUpper.includes('LIT') || sUpper.includes('LANG')) {
    subjectRules = `\nSUBJECT SPECIFIC RULE (ENGLISH/LANGUAGE ARTS):\n- Focus on grammar, vocabulary, sentence construction, reading comprehension, parts of speech.\n- DO NOT generate science or math calculations.`;
  }

  let deduplicationInstruction = '';
  if (existingQuestions.length > 0) {
    const recentTexts = existingQuestions.slice(0, 15).map(q => `- ${q.question}`).join('\n');
    deduplicationInstruction = `\n\nCRITICAL DEDUPLICATION RULE:\nDO NOT GENERATE any questions that are identical or nearly identical to these:\n${recentTexts}\n`;
  }

  let materialInstruction = '';
  if (sourceMaterialText) {
    materialInstruction = `\nSOURCE MATERIAL (${sourceMaterialName}):\n${sourceMaterialText.slice(0, 2500)}\nBase your questions exclusively on this material.\n`;
  }

  const systemInstruction = `You are an expert ${subject} Teacher creating a quiz for ${studentClass}.
Your goal is to generate ${numberOfQuestions} unique questions on the topic "${topic}" from "${chapter}".
Difficulty Level: ${difficulty}
Question Type Allowed: ${questionType === 'mixed' ? 'A balanced mix of mcq, true_false, fill_blank, short' : questionType}
${subjectRules}
${materialInstruction}${deduplicationInstruction}

OUTPUT FORMAT:
Return ONLY a valid JSON array of question objects. Do not include markdown formatting or backticks.
Schema:
[
  {
    "question": "Question text...",
    "type": "mcq" | "true_false" | "fill_blank" | "short",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Exact string of correct answer",
    "explanation": "Brief explanation of the answer",
    "difficulty": "${difficulty}",
    "marks": 2
  }
]`;

  const prompt = `Generate the ${subject} quiz for topic "${topic}" now in strict JSON format.`;

  let validQuestions = [];

  try {
    // 3. Call Gemini
    const responseText = await geminiClient.generateText(prompt, systemInstruction);
    
    // 4. Parse & Validate
    const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      const parsed = Array.isArray(parsedData) ? parsedData : [parsedData];
      for (const q of parsed) {
        if (validateQuestion(q, questionType)) {
          if (!isDuplicate(q.question, validQuestions) && !isDuplicate(q.question, existingQuestions)) {
            validQuestions.push(q);
          }
        }
      }
    }
  } catch (apiErr) {
    console.warn('Gemini quiz generation notice:', apiErr.message);
  }

  // 5. Fill missing questions if deduplication stripped too many
  while (validQuestions.length < numberOfQuestions) {
    validQuestions.push({
      question: `Fallback Question: Explain a key application of ${topic} in ${subject}.`,
      type: 'short',
      options: [],
      correctAnswer: 'Subjective answer depending on student perspective.',
      explanation: 'Evaluates critical thinking.',
      difficulty,
      marks: 2,
    });
  }

  const finalQuestions = validQuestions.slice(0, numberOfQuestions);

  return {
    title: `${studentClass} ${subject} (Ch. ${chapter}): ${topic}`,
    grade: studentClass,
    subject,
    chapter,
    topic,
    difficulty,
    questionType,
    totalMarks: finalQuestions.reduce((acc, q) => acc + (q.marks || 2), 0),
    sourceMaterialName: sourceMaterialName || '',
    questions: finalQuestions,
  };
};
