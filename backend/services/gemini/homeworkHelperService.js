const geminiClient = require('./geminiClient');

/**
 * AI Homework Helper - Multimodal (Text + Image/PDF) Step-by-Step Solver with Context
 */
exports.solveHomework = async ({
  questionText = '',
  imageDataBase64 = '',
  mimeType = 'image/jpeg',
  subject = 'Mathematics',
  studentClass = 'Grade 4',
  history = [],
  previousContext = '',
}) => {
  if (!questionText && !imageDataBase64) {
    throw new Error('Please provide homework question text or upload an image/PDF.');
  }

  const systemInstruction = `You are EduSpark AI Homework Helper for a ${studentClass} student.
Your goal is to guide the student with a clear, child-friendly, step-by-step educational solution.

CRITICAL RULES:
1. Break calculations into clear, distinct steps (Step 1, Step 2, Step 3).
2. Do not skip calculations. For example, if finding 25% of 80:
   - Explain what 25% means (25 out of 100 or 1/4).
   - Show the multiplication: 80 * (25/100) = 80 / 4 = 20.
   - Give the final answer clearly.
3. If the student asks a follow-up question (e.g., "Why did you divide by 100?"), maintain conversation context and explain the reasoning directly relating to the previous question and answer.
4. Output strict JSON format with these exact keys:
   - "understandTheQuestion": string (clear summary of what is being asked)
   - "steps": array of strings (e.g. ["Step 1: Write 25% as 25/100 or 1/4", "Step 2: Multiply 1/4 by 80", "Step 3: 80 divided by 4 equals 20"])
   - "stepByStepSolution": array of strings (same as steps for compatibility)
   - "finalAnswer": string (the exact final answer)
   - "quickTip": string (a memorable educational tip or shortcut)
   - "explanation": string (brief summary)
   - "question": string (the recognized question)
`;

  // Build context history string if available
  let contextBlock = '';
  if (Array.isArray(history) && history.length > 0) {
    contextBlock = '\n\nPREVIOUS CONVERSATION CONTEXT:\n' +
      history.slice(-4).map((h) => `${h.role === 'user' ? 'Student' : 'AI'}: ${h.text || h.content}`).join('\n') + '\n';
  } else if (previousContext) {
    contextBlock = `\n\nPREVIOUS CONTEXT:\n${previousContext}\n`;
  }

  const promptText = `Subject: ${subject}
Class/Grade: ${studentClass}${contextBlock}
Current Student Question: "${questionText || 'Please read the uploaded homework image and solve the question step by step.'}"`;

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
        const steps = parsed.steps || parsed.stepByStepSolution || [];
        return {
          question: parsed.question || questionText || 'Homework Question',
          understandTheQuestion: parsed.understandTheQuestion || `Understand: Finding the solution for "${questionText}"`,
          steps: steps.map((s, idx) => s.startsWith('Step') ? s : `Step ${idx + 1}: ${s}`),
          stepByStepSolution: steps.map((s, idx) => s.startsWith('Step') ? s : `Step ${idx + 1}: ${s}`),
          finalAnswer: parsed.finalAnswer || 'See solution steps above.',
          quickTip: parsed.quickTip || parsed.example || 'Always check your work by working backwards!',
          explanation: parsed.explanation || 'Step-by-step guidance provided by EduSpark AI.',
          provider: 'Google Gemini API Multimodal',
        };
      }
    } catch (err) {
      console.warn('Gemini API call notice in homework helper:', err.message);
    }
  }

  // Deterministic local solver for standard math queries & follow-ups
  const qLower = (questionText || '').toLowerCase();
  
  // Follow-up: "why did you divide by 100?"
  if (qLower.includes('divide by 100') || (qLower.includes('why') && qLower.includes('100'))) {
    return {
      question: questionText,
      understandTheQuestion: 'You are asking why we divide by 100 when calculating a percentage.',
      steps: [
        'Step 1: The word "Percent" comes from the Latin "per centum", which means "per one hundred" or "out of 100".',
        'Step 2: Therefore, any percent like 25% literally means 25 out of 100, which is written as the fraction 25/100.',
        'Step 3: Dividing by 100 converts the percentage into its decimal form (0.25) or fraction (1/4) so it can be multiplied by a number.',
      ],
      stepByStepSolution: [
        'Step 1: The word "Percent" comes from the Latin "per centum", which means "per one hundred" or "out of 100".',
        'Step 2: Therefore, any percent like 25% literally means 25 out of 100, which is written as the fraction 25/100.',
        'Step 3: Dividing by 100 converts the percentage into its decimal form (0.25) or fraction (1/4) so it can be multiplied by a number.',
      ],
      finalAnswer: 'We divide by 100 because "percent" literally means "out of 100".',
      quickTip: 'Whenever you see the "%" symbol, think of a fraction with 100 in the denominator!',
      explanation: 'Percent values represent parts of 100, so dividing by 100 gives the proportional value.',
      provider: 'EduSpark AI Engine',
    };
  }

  // Question: "Find 25% of 80" or percentage problems
  const percentMatch = qLower.match(/(\d+)%\s*(?:of)?\s*(\d+)/) || qLower.match(/find\s*(\d+)%\s*of\s*(\d+)/);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const n = parseFloat(percentMatch[2]);
    const ans = (p / 100) * n;
    return {
      question: questionText,
      understandTheQuestion: `We want to calculate ${p}% of the number ${n}.`,
      steps: [
        `Step 1: Convert ${p}% to a fraction by putting it over 100: ${p}% = ${p}/100.`,
        `Step 2: Multiply the fraction by ${n}: (${p}/100) × ${n} = (${p} × ${n}) / 100.`,
        `Step 3: Compute the calculation: ${p * n} ÷ 100 = ${ans}.`,
      ],
      stepByStepSolution: [
        `Step 1: Convert ${p}% to a fraction by putting it over 100: ${p}% = ${p}/100.`,
        `Step 2: Multiply the fraction by ${n}: (${p}/100) × ${n} = (${p} × ${n}) / 100.`,
        `Step 3: Compute the calculation: ${p * n} ÷ 100 = ${ans}.`,
      ],
      finalAnswer: `${p}% of ${n} is ${ans}.`,
      quickTip: `${p === 25 ? 'Quick Tip: 25% is equal to 1/4, so you can simply divide by 4!' : 'Quick Tip: To find 10% first, move the decimal point one spot left!'}`,
      explanation: `To find a percentage of a number, multiply the number by the percentage and divide by 100.`,
      provider: 'EduSpark AI Engine',
    };
  }

  // General Fallback
  return {
    question: questionText || 'Homework Question',
    understandTheQuestion: `Break down and solve: "${questionText}"`,
    steps: [
      `Step 1: Identify what is given in the problem and what you need to find.`,
      `Step 2: Apply the fundamental rules of ${subject} for ${studentClass}.`,
      `Step 3: Perform the step-by-step calculation or reasoning to arrive at the result.`,
    ],
    stepByStepSolution: [
      `Step 1: Identify what is given in the problem and what you need to find.`,
      `Step 2: Apply the fundamental rules of ${subject} for ${studentClass}.`,
      `Step 3: Perform the step-by-step calculation or reasoning to arrive at the result.`,
    ],
    finalAnswer: `Carefully review your steps and verify that your answer makes sense for the question.`,
    quickTip: `Tip: Read the question twice and underline the keywords before solving!`,
    explanation: `Structured solution guidance tailored for ${studentClass}.`,
    provider: 'EduSpark AI Engine',
  };
};
