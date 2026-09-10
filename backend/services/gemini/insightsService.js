const geminiClient = require('./geminiClient');

/**
 * Student Insights Generator - Accepts DB-calculated stats and returns AI recommendations
 */
exports.generateStudentInsights = async ({
  studentName = 'Student',
  grade = 'Grade 4',
  stats = {},
  quizScores = [],
  subjectScores = {},
}) => {
  const quizAvg = stats.quizAverage || 85;
  const hwComp = stats.homeworkCompletion || 90;

  const systemInstruction = `You are EduSpark AI Student Performance Specialist.
Analyze the database-calculated student statistics provided. Do NOT recalculate basic percentages.

Return strictly valid JSON format matching keys:
- "strengths": array of strings (top strong subjects or skills)
- "weaknesses": array of strings (topics requiring extra practice)
- "learningRecommendations": array of strings (3 actionable recommendations)
- "topicsRequiringAttention": array of strings
- "suggestedStudyPlan": string (weekly study roadmap)
- "personalizedPractice": array of strings (2 practice activities)
- "summaryMessage": string (encouraging personalized summary for student)
`;

  const prompt = `Student Name: ${studentName} (${grade})
Calculated Stats from Database:
- Quiz Average: ${quizAvg}%
- Homework Completion: ${hwComp}%
- Subject Breakdown: ${JSON.stringify(subjectScores || { Math: 85, Science: 68, English: 92 })}
- Recent Quiz Scores: ${JSON.stringify(quizScores || [80, 85, 90])}`;

  if (geminiClient.hasApiKey()) {
    try {
      const text = await geminiClient.generateText(prompt, systemInstruction);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          studentName,
          ...parsed,
          provider: 'Google Gemini API Analytics Engine',
        };
      }
    } catch (err) {
      console.error('Gemini Student Insights API error:', err.message);
      throw err;
    }
  }

  // Offline Fallback
  return {
    studentName,
    strengths: quizAvg >= 80 ? ['Reading Comprehension', 'English Grammar', 'Geometry'] : ['Basic Arithmetic'],
    weaknesses: quizAvg < 80 ? ['Fractions Addition', 'Word Problems'] : ['Multi-step Algebra'],
    learningRecommendations: [
      'Practice 15 minutes of visual fraction diagrams daily.',
      'Read 20 minutes before bedtime to maintain top English scores.',
      'Complete 1 adaptive science quiz to reinforce plant biology.',
    ],
    topicsRequiringAttention: quizAvg < 80 ? ['Long Division', 'Decimal Conversion'] : ['Word Problems'],
    suggestedStudyPlan: `Weekly Roadmap: 3 days of Math problem solving (15m), 2 days of Science concept review (20m), 5-day study streak goal.`,
    personalizedPractice: [
      'Solve 5 equivalent fractions problems on paper.',
      'Explain 1 science concept out loud to a parent or peer.',
    ],
    summaryMessage: `Your strongest area is English (${subjectScores.English || 91}%). Science (${subjectScores.Science || 62}%) needs extra visual practice!`,
    provider: 'EduSpark AI Engine (Offline Mode)',
  };
};

/**
 * Teacher Classroom Insights Generator - Accepts DB class performance data and returns intervention plans
 */
exports.generateTeacherInsights = async ({
  className = 'Grade 4 - Alpha',
  stats = {},
  flaggedStudents = [],
  subjectPerformance = {},
}) => {
  const systemInstruction = `You are EduSpark AI Classroom Performance Specialist for teachers.
Analyze classroom stats calculated by the database.

Return strictly valid JSON format matching keys:
- "classStrengths": array of strings
- "weakAreas": array of strings (class-wide weak topics)
- "studentsNeedingAttention": array of strings (student names or IDs)
- "suggestedInterventions": array of strings (action steps for teacher)
- "suggestedRevisionTopics": array of strings
- "recommendedDifficultyLevel": string ("Easy" | "Medium" | "Hard")
- "insightsSummary": string (actionable teacher overview)
`;

  const prompt = `Classroom: ${className}
Calculated Class Stats:
- Class Average: ${stats.classAverage || 82}%
- Pending Assignments: ${stats.pendingHomeworks || 2}
- Subject Performance: ${JSON.stringify(subjectPerformance || { Math: 82, Science: 74, English: 90 })}
- Flagged At-Risk Students: ${JSON.stringify(flaggedStudents || ['Oliver Smith (missed 2 assignments)'])}`;

  if (geminiClient.hasApiKey()) {
    try {
      const text = await geminiClient.generateText(prompt, systemInstruction);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          className,
          ...parsed,
          provider: 'Google Gemini API Teacher Insights Engine',
        };
      }
    } catch (err) {
      console.error('Gemini Teacher Insights API error:', err.message);
      throw err;
    }
  }

  // Offline Fallback
  return {
    className,
    classStrengths: ['English Reading & Comprehension', 'Homework On-time Submissions'],
    weakAreas: ['Decimal Division', 'Fractions Word Problems'],
    studentsNeedingAttention: ['Oliver Smith (2 missed assignments)', 'Maya Lin (needs decimal hint assistance)'],
    suggestedInterventions: [
      'Schedule a 10-minute guided group review on Equivalent Fractions.',
      'Assign visual fraction matching games as homework for at-risk students.',
      'Send parent progress notifications for students scoring below 70%.',
    ],
    suggestedRevisionTopics: ['Fractions Addition', 'Decimal Division'],
    recommendedDifficultyLevel: 'Medium',
    insightsSummary: `Classroom overall performance is steady at ${stats.classAverage || 82}%. Science and Decimal Division require class-wide mini-lessons.`,
    provider: 'EduSpark AI Engine (Offline Mode)',
  };
};
