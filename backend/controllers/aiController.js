const geminiService = require('../services/gemini');

// Helper to sanitize error response
const handleAiError = (res, err, defaultMsg) => {
  console.error(`AI Service Error [${defaultMsg}]:`, err.message || err);
  return res.status(500).json({
    success: false,
    message: err.message || defaultMsg || 'AI Service is temporarily unavailable. Please try again in a moment.',
  });
};

/**
 * @desc    AI Tutor Multi-turn Endpoint
 * @route   POST /api/ai/tutor
 * @access  Private
 */
exports.handleAiTutor = async (req, res) => {
  try {
    const { studentId, subject, class: studentClass, topic, question, conversationHistory } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a valid question for the AI Tutor.' });
    }

    const result = await geminiService.aiTutor({
      studentId: studentId || req.user?.id,
      subject: subject || 'General Science',
      studentClass: studentClass || req.user?.grade || 'Grade 4',
      topic: topic || 'General Topic',
      question,
      conversationHistory: conversationHistory || [],
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'AI Tutor is temporarily unavailable. Please try again in a moment.');
  }
};

/**
 * @desc    AI Homework Helper Endpoint (Text + Multimodal)
 * @route   POST /api/ai/homework
 * @access  Private
 */
exports.handleHomeworkHelper = async (req, res) => {
  try {
    const { question, questionText, imageDataBase64, mimeType, subject, class: studentClass } = req.body;

    const qText = question || questionText || '';
    if (!qText && !imageDataBase64) {
      return res.status(400).json({ success: false, message: 'Please enter homework text or attach an image/document.' });
    }

    const result = await geminiService.solveHomework({
      questionText: qText,
      imageDataBase64,
      mimeType: mimeType || 'image/jpeg',
      subject: subject || 'General Subject',
      studentClass: studentClass || req.user?.grade || 'Grade 4',
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'AI Homework Helper is temporarily unavailable. Please try again in a moment.');
  }
};

/**
 * @desc    AI Quiz Generator Endpoint
 * @route   POST /api/ai/quiz/generate
 * @access  Private
 */
exports.handleQuizGenerate = async (req, res) => {
  try {
    const { subject, topic } = req.body;
    if (!subject || !topic) {
      return res.status(400).json({ success: false, message: 'Subject and Topic are required to generate an AI Quiz.' });
    }

    const result = await geminiService.generateQuiz(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'AI Quiz Generator is temporarily unavailable. Please try again in a moment.');
  }
};

/**
 * @desc    Multimodal OCR + AI Scanner Endpoint
 * @route   POST /api/ai/ocr-scan
 * @access  Private
 */
exports.handleOcrScan = async (req, res) => {
  try {
    const { subject, class: studentClass } = req.body;
    let imageDataBase64 = req.body.imageDataBase64;
    let mimeType = req.body.mimeType || 'image/jpeg';

    if (req.file) {
      imageDataBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
    }

    if (!imageDataBase64) {
      return res.status(400).json({ success: false, message: 'Please upload an image or notebook page.' });
    }

    const result = await geminiService.solveHomework({
      questionText: 'Recognize the handwriting/text in this image and explain the solution step by step.',
      imageDataBase64,
      mimeType,
      subject: subject || 'Mathematics',
      studentClass: studentClass || req.user?.grade || 'Grade 4',
    });

    return res.status(200).json({
      success: true,
      extractedText: result.question || 'Extracted handwritten text from notebook.',
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'OCR Scanner is temporarily unavailable. Please try again in a moment.');
  }
};

/**
 * @desc    Teacher Content Analyzer Endpoint
 * @route   POST /api/ai/content/analyze
 * @access  Private (Teacher/Admin)
 */
exports.handleContentAnalyze = async (req, res) => {
  try {
    const { contentName, contentText, imageDataBase64, mimeType } = req.body;

    if (!contentText && !imageDataBase64) {
      return res.status(400).json({ success: false, message: 'Please provide study material text or upload a document.' });
    }

    const result = await geminiService.analyzeContent({
      contentName: contentName || 'Uploaded Study Material',
      contentText: contentText || '',
      imageDataBase64: imageDataBase64 || '',
      mimeType: mimeType || 'image/jpeg',
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'Content Analyzer is temporarily unavailable. Please try again in a moment.');
  }
};

/**
 * @desc    Student AI Insights Endpoint
 * @route   POST /api/ai/student-insights
 * @access  Private (Student/Parent)
 */
exports.handleStudentInsights = async (req, res) => {
  try {
    const { studentName, grade, stats, quizScores, subjectScores } = req.body;

    const result = await geminiService.generateStudentInsights({
      studentName: studentName || req.user?.name || 'Student',
      grade: grade || req.user?.grade || 'Grade 4',
      stats: stats || {},
      quizScores: quizScores || [],
      subjectScores: subjectScores || {},
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'Student AI Insights is temporarily unavailable.');
  }
};

/**
 * @desc    Teacher AI Classroom Insights Endpoint
 * @route   POST /api/ai/teacher-insights
 * @access  Private (Teacher/Admin)
 */
exports.handleTeacherInsights = async (req, res) => {
  try {
    const { className, stats, flaggedStudents, subjectPerformance } = req.body;

    const result = await geminiService.generateTeacherInsights({
      className: className || 'Grade 4 Classroom',
      stats: stats || {},
      flaggedStudents: flaggedStudents || [],
      subjectPerformance: subjectPerformance || {},
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleAiError(res, err, 'Teacher AI Insights is temporarily unavailable.');
  }
};
