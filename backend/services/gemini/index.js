const geminiClient = require('./geminiClient');
const aiTutorService = require('./aiTutorService');
const homeworkHelperService = require('./homeworkHelperService');
const quizGeneratorService = require('./quizGeneratorService');
const contentAnalyzerService = require('./contentAnalyzerService');
const insightsService = require('./insightsService');

module.exports = {
  client: geminiClient,
  aiTutor: aiTutorService.askAiTutor,
  solveHomework: homeworkHelperService.solveHomework,
  generateQuiz: quizGeneratorService.generateQuiz,
  analyzeContent: contentAnalyzerService.analyzeContent,
  generateStudentInsights: insightsService.generateStudentInsights,
  generateTeacherInsights: insightsService.generateTeacherInsights,
};
