const geminiClient = require('./geminiClient');

/**
 * Teacher Content Analyzer Service - Extracts key educational metadata from notes/textbook/PDFs
 */
exports.analyzeContent = async ({
  contentName = 'Uploaded Document',
  contentText = '',
  imageDataBase64 = '',
  mimeType = 'image/jpeg',
}) => {
  if (!contentText && !imageDataBase64) {
    throw new Error('Please provide study material text or upload a document/image.');
  }

  const systemInstruction = `You are EduSpark AI Content Analyzer for educators.
Analyze the provided educational content (text, PDF, or notes image).

Return strictly valid JSON format with keys:
- "subject": string (e.g. Mathematics, Biology, Physics, Computer Science)
- "chapter": string (e.g. Chapter 4: Photosynthesis)
- "topics": array of strings (key topics covered)
- "importantConcepts": array of strings (core concepts taught)
- "keyTerms": array of strings (vocabulary/definitions)
- "learningObjectives": array of strings (what students will master)
- "summary": string (concise 2-sentence overview)
`;

  const prompt = `Content Name: "${contentName}"
Content Excerpt:
"""
${(contentText || '').slice(0, 3000)}
"""`;

  if (geminiClient.hasApiKey()) {
    try {
      let textResponse = '';
      if (imageDataBase64) {
        textResponse = await geminiClient.generateMultimodal(prompt, mimeType, imageDataBase64, systemInstruction);
      } else {
        textResponse = await geminiClient.generateText(prompt, systemInstruction);
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          contentName,
          ...parsed,
          provider: 'Google Gemini API Content Analyzer',
        };
      }
    } catch (err) {
      console.error('Gemini Content Analyzer API error:', err.message);
      throw err;
    }
  }

  // Offline Fallback
  return {
    contentName,
    subject: 'General Science / Mathematics',
    chapter: 'Chapter 1: Core Fundamentals',
    topics: ['Key Topic 1', 'Key Topic 2', 'Key Topic 3'],
    importantConcepts: ['Core Principle A', 'Fundamental Law B', 'Practical Application C'],
    keyTerms: ['Term 1', 'Definition 2', 'Formula 3'],
    learningObjectives: [
      'Understand foundational rules and properties.',
      'Apply step-by-step problem solving.',
      'Master core concepts for assessments.',
    ],
    summary: `Analyzed study material for "${contentName}". Includes key educational concepts and learning goals.`,
    provider: 'EduSpark AI Engine (Offline Mode)',
  };
};
