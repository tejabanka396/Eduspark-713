const geminiClient = require('./geminiClient');

/**
 * AI Homework Helper - Multimodal (Text + Image/PDF) Step-by-Step Solver
 */
exports.solveHomework = async ({
  questionText = '',
  imageDataBase64 = '',
  mimeType = 'image/jpeg',
  subject = 'General Subject',
  studentClass = 'Grade 4',
}) => {
  if (!questionText && !imageDataBase64) {
    throw new Error('Please provide homework question text or upload an image/PDF.');
  }

  const systemInstruction = `You are EduSpark AI Homework Helper for ${studentClass}.
Your goal is to guide the student with a complete, structured, step-by-step solution.

CRITICAL RULES:
1. Provide a step-by-step explanation.
2. Break math problems into individual calculation steps.
3. Break science/coding questions into conceptual steps.
4. Structure the response strictly in JSON format matching keys:
   - "question": string (extracted question text)
   - "stepByStepSolution": array of string steps
   - "explanation": string (clear conceptual guide)
   - "finalAnswer": string (clear final result)
   - "example": string (similar example)
   - "practiceQuestion": string (1 practice problem for the student)
`;

  const promptText = `Subject: ${subject}
Class/Grade: ${studentClass}
Student Question: "${questionText || 'Please read the uploaded image/document and solve the question.'}"`;

  if (geminiClient.hasApiKey()) {
    try {
      let rawText = '';
      if (imageDataBase64) {
        rawText = await geminiClient.generateMultimodal(promptText, mimeType, imageDataBase64, systemInstruction);
      } else {
        rawText = await geminiClient.generateText(promptText, systemInstruction);
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          provider: 'Google Gemini API Multimodal',
        };
      } else {
        return {
          question: questionText || 'Homework Question',
          stepByStepSolution: [rawText],
          explanation: 'Step-by-step guidance provided by Gemini AI.',
          finalAnswer: 'See step-by-step solution above.',
          example: 'Practice similar problems using the steps provided.',
          practiceQuestion: 'Try solving a variation of this problem using the same steps!',
          provider: 'Google Gemini API Multimodal',
        };
      }
    } catch (err) {
      console.error('Gemini Homework Helper API error:', err.message);
      throw err; // Throw exact error so frontend can see it
    }
  }

  // Offline Fallback
  return {
    question: questionText || 'Sample Homework Problem',
    stepByStepSolution: [
      'Step 1: Identify given quantities and what is requested in the question.',
      'Step 2: Apply standard rules and formulas for ' + subject + '.',
      'Step 3: Calculate or derive the result step by step.',
      'Step 4: Check your answer by plugging it back into the original question.',
    ],
    explanation: `This problem requires applying foundational concepts of ${subject} for ${studentClass}.`,
    finalAnswer: `Resolved according to ${subject} principles.`,
    example: `Similar Problem: If 2x + 4 = 10, subtract 4 -> 2x = 6 -> x = 3.`,
    practiceQuestion: `Practice: Try solving a similar question from Chapter 1!`,
    provider: 'EduSpark AI Engine (Offline Mode)',
  };
};
