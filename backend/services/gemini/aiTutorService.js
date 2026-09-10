const geminiClient = require('./geminiClient');

/**
 * AI Tutor Service - Socratic & Structured Educational Assistance
 */
exports.askAiTutor = async ({
  studentId,
  subject = 'General Science',
  studentClass = 'Grade 4',
  topic = 'General Topic',
  question,
  conversationHistory = [],
}) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('Please provide a valid question for the AI Tutor.');
  }

  const cleanQuestion = question.trim();

  // Format conversation history for context memory
  let historyContext = '';
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6); // Keep last 6 turns for token efficiency
    historyContext = recentHistory
      .map((turn) => {
        const sender = turn.role === 'user' || turn.sender === 'student' ? 'Student' : 'AI Tutor';
        const msg = turn.text || turn.content || turn.message || '';
        return `${sender}: ${msg}`;
      })
      .join('\n');
  }

  const systemInstruction = `You are EduSpark AI Tutor, a highly encouraging, friendly, and expert school AI tutor for ${studentClass}.

CRITICAL TUTORING RULES:
1. NEVER give the direct answer to the student's question. For example, if they ask "What is 2 + 2?", do NOT say "4". Instead, guide them so they can figure it out themselves.
2. Auto-detect the Subject and Topic based on the student's question (e.g., Mathematics, Science, History, Language Arts) and tutor them accordingly in an age-appropriate way.
3. Structure your response clearly using exactly these six sections (and no others):

💡 AI Hint: (Provide a simple clue, visual analogy, or conceptual guidance suitable for ${studentClass} to lead them toward the answer)

📖 Simple Explanation: (An easy-to-understand conceptual breakdown using relatable analogies)

🔢 Step-by-Step Explanation: (Logical steps, questions, or guidelines to help them solve it)

🌟 Example: (A practical, relatable real-life application or example)

⭐ Key Points: (Bullet points of essential takeaways)

❓ Practice Question: (A friendly, encouraging question prompting them to test their understanding)
`;

  const prompt = `${historyContext ? `CONVERSATION HISTORY:\n${historyContext}\n\n` : ''}CURRENT STUDENT QUESTION: "${cleanQuestion}"`;

  if (!geminiClient.hasApiKey()) {
    throw new Error('The AI service is temporarily unavailable. Please try again in a moment.');
  }

  try {
    const text = await geminiClient.generateText(prompt, systemInstruction);
    return {
      answer: text,
      subject,
      topic,
      grade: studentClass,
      provider: 'Google Gemini API (Centralized Engine)',
    };
  } catch (err) {
    console.error('[AI Tutor Service] Gemini generation failed:', err.message);
    throw new Error('The AI service is temporarily unavailable. Please try again in a moment.');
  }
};
