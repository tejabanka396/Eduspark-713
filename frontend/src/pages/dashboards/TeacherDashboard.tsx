import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import {
  GraduationCap,
  LogOut,
  BookOpen,
  FileCheck,
  Sparkles,
  Clock,
  Plus,
  Video,
  BarChart2,
  MessageSquare,
  X,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'homework' | 'ai-quiz' | 'analytics' | 'communication'>('overview');

  // State Data
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [workingHours, setWorkingHours] = useState<any>({ isWorkingHours: true, workingHours: '9:00 AM – 4:00 PM' });

  // Notifications & Loading
  const [notification, setNotification] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lesson Form State
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<any>({
    title: '',
    description: '',
    grade: 'Grade 4',
    subject: 'Mathematics',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/embed/n0FQSx012N8',
    fileUrl: '',
  });

  // Homework Form State
  const [showHwModal, setShowHwModal] = useState<boolean>(false);
  const [hwData, setHwData] = useState<any>({
    title: '',
    description: '',
    grade: 'Grade 4',
    subject: 'Mathematics',
    dueDate: '2026-07-30',
    totalMarks: 100,
  });

  // Grading Modal State
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradingMarks, setGradingMarks] = useState<number>(90);
  const [gradingFeedback, setGradingFeedback] = useState<string>('Great effort!');

  // AI Quiz Generator Form State
  const [aiQuizData, setAiQuizData] = useState<any>({
    grade: 'Grade 4',
    subject: 'Mathematics',
    chapter: 'Chapter 1',
    topic: 'Quadratic Equations',
    difficulty: 'Medium',
    questionType: 'mixed',
    numberOfQuestions: 4,
    totalMarks: 10,
    sourceMaterialName: '',
    sourceMaterialText: '',
  });
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [previewQuiz, setPreviewQuiz] = useState<any>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState<boolean>(false);
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);
  const [editQForm, setEditQForm] = useState<any>({});
  const [showMaterialInput, setShowMaterialInput] = useState<boolean>(false);

  // Load Data on Mount and Sync Profile Defaults
  useEffect(() => {
    loadAllTeacherData();
  }, []);

  useEffect(() => {
    if (user) {
      const defaultSubject = user.subjects && user.subjects.length > 0 ? user.subjects[0] : (user.subject || 'Mathematics');
      const defaultGrade = user.grades && user.grades.length > 0 ? user.grades[0] : 'Grade 4';
      
      setLessonData((prev: any) => ({ ...prev, subject: defaultSubject, grade: defaultGrade }));
      setHwData((prev: any) => ({ ...prev, subject: defaultSubject, grade: defaultGrade }));
      setAiQuizData((prev: any) => ({ ...prev, subject: defaultSubject, grade: defaultGrade }));
    }
  }, [user]);

  const loadAllTeacherData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, lessonsRes, hwRes, quizzesRes, analyticsRes, whRes] = await Promise.all([
        fetchApi<any>('/teacher/stats').catch(() => null),
        fetchApi<any>('/teacher/lessons').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/homeworks').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/quizzes').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/analytics').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/working-hours').catch(() => ({ isWorkingHours: true })),
      ]);

      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
        setAnnouncements(statsRes.announcements || []);
        setAlerts(statsRes.alerts || []);
      }
      setLessons(lessonsRes.data || []);
      setHomeworks(hwRes.data || []);
      setQuizzes(quizzesRes.data || []);
      setAnalytics(analyticsRes.data || []);
      if (whRes) setWorkingHours(whRes);
    } catch (err) {
      console.error('Error loading teacher data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Submit New Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<any>('/teacher/lessons', {
        method: 'POST',
        body: JSON.stringify(lessonData),
      });

      if (res.success) {
        showToast(res.message || 'Lesson published!');
        setShowLessonModal(false);
        setLessonData({
          title: '',
          description: '',
          grade: 'Grade 4',
          subject: 'Mathematics',
          category: 'daily',
          contentType: 'video',
          youtubeUrl: 'https://www.youtube.com/embed/n0FQSx012N8',
          fileUrl: '',
        });
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error publishing lesson.');
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const res = await fetchApi<any>(`/teacher/lessons/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Lesson deleted.');
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lesson.');
    }
  };

  // Submit New Homework
  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<any>('/teacher/homeworks', {
        method: 'POST',
        body: JSON.stringify(hwData),
      });

      if (res.success) {
        showToast(res.message || 'Homework assigned!');
        setShowHwModal(false);
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating homework.');
    }
  };

  // Grade Student Submission
  const handleSaveGrade = async (hwId: string, subId: string) => {
    try {
      const res = await fetchApi<any>(`/teacher/homeworks/${hwId}/grade/${subId}`, {
        method: 'PUT',
        body: JSON.stringify({ marksObtained: gradingMarks, feedback: gradingFeedback }),
      });

      if (res.success) {
        showToast('Submission graded!');
        setSelectedSub(null);
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving grade.');
    }
  };

  // AI Quiz Generator Submit (Generate Preview)
  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingQuiz(true);
    try {
      const res = await fetchApi<any>('/ai/quiz/generate', {
        method: 'POST',
        body: JSON.stringify({ ...aiQuizData, saveImmediately: false }),
      });

      if (res.success && res.data) {
        setPreviewQuiz(res.data);
        showToast('✨ Quiz preview generated! Review, edit, or regenerate questions before publishing.');
      }
    } catch (err: any) {
      showToast(err.message || 'AI Quiz Generation failed.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Regenerate Single Question
  const handleRegenerateQuestion = async (index: number) => {
    if (!previewQuiz) return;
    setRegeneratingIndex(index);
    try {
      const existingQs = previewQuiz.questions || [];
      const res = await fetchApi<any>('/teacher/quizzes/regenerate-question', {
        method: 'POST',
        body: JSON.stringify({
          grade: previewQuiz.grade,
          subject: previewQuiz.subject,
          chapter: previewQuiz.chapter,
          topic: previewQuiz.topic,
          difficulty: previewQuiz.difficulty,
          questionType: previewQuiz.questionType,
          existingQuestions: existingQs,
          sourceMaterialText: aiQuizData.sourceMaterialText,
        }),
      });

      if (res.success && res.data) {
        const updatedQuestions = [...previewQuiz.questions];
        updatedQuestions[index] = res.data;
        setPreviewQuiz({ ...previewQuiz, questions: updatedQuestions });
        showToast(`⚡ Question #${index + 1} regenerated successfully!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate question.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Add Question to Preview
  const handleAddQuestionToPreview = async () => {
    if (!previewQuiz) return;
    const nextIdx = previewQuiz.questions.length;
    setRegeneratingIndex(nextIdx);
    try {
      const res = await fetchApi<any>('/teacher/quizzes/regenerate-question', {
        method: 'POST',
        body: JSON.stringify({
          grade: previewQuiz.grade,
          subject: previewQuiz.subject,
          chapter: previewQuiz.chapter,
          topic: previewQuiz.topic,
          difficulty: previewQuiz.difficulty,
          questionType: previewQuiz.questionType,
          existingQuestions: previewQuiz.questions,
          sourceMaterialText: aiQuizData.sourceMaterialText,
        }),
      });

      if (res.success && res.data) {
        setPreviewQuiz({
          ...previewQuiz,
          questions: [...previewQuiz.questions, res.data],
        });
        showToast('✨ New question added to quiz!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add question.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Start Inline Editing Question
  const handleStartEditQuestion = (index: number) => {
    setEditingQIndex(index);
    setEditQForm({ ...previewQuiz.questions[index] });
  };

  // Save Inline Edit Question
  const handleSaveEditQuestion = (index: number) => {
    const updated = [...previewQuiz.questions];
    updated[index] = editQForm;
    setPreviewQuiz({ ...previewQuiz, questions: updated });
    setEditingQIndex(null);
    showToast('Question updated!');
  };

  // Delete Question from Preview
  const handleDeleteQuestionFromPreview = (index: number) => {
    const updated = previewQuiz.questions.filter((_: any, i: number) => i !== index);
    setPreviewQuiz({ ...previewQuiz, questions: updated });
    showToast('Question removed from preview.');
  };

  // Save / Publish Final Quiz
  const handlePublishQuiz = async () => {
    if (!previewQuiz || !previewQuiz.questions || !previewQuiz.questions.length) {
      showToast('Quiz must have at least 1 question.');
      return;
    }
    setIsSavingQuiz(true);
    try {
      const res = await fetchApi<any>('/teacher/quizzes/save', {
        method: 'POST',
        body: JSON.stringify(previewQuiz),
      });

      if (res.success) {
        showToast('✨ AI Quiz successfully published and assigned to students!');
        setPreviewQuiz(null);
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish quiz.');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Delete Published Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this published quiz?')) return;
    try {
      const res = await fetchApi<any>(`/teacher/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('Quiz deleted.');
        loadAllTeacherData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete quiz.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 flex items-center gap-2">
              EduSpark AI <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Teacher Workspace</span>
            </h1>
            <p className="text-xs text-slate-500">Primary Education Management & AI Tutoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          {/* Working Hours Indicator */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              workingHours.isWorkingHours
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{workingHours.isWorkingHours ? 'Available (9 AM – 4 PM)' : 'Unavailable Outside Hours'}</span>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800">{user?.name}</p>
            <p className="text-xs text-indigo-600 font-bold">
              {user?.subjects && user.subjects.length > 0
                ? user.subjects.join(' & ')
                : (user?.subject || 'Mathematics & Science')}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1">
        {isLoading && (
          <div className="mb-4 text-xs font-bold text-slate-400 animate-pulse flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            Loading Teacher Workstation...
          </div>
        )}
        {/* Toast Alert */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')}>
              <X className="w-5 h-5 text-white/80 hover:text-white" />
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Overview & Alerts
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lessons' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Video className="w-4 h-4" /> Lesson Uploads ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'homework' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Homework Module ({homeworks.length})
          </button>
          <button
            onClick={() => setActiveTab('ai-quiz')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ai-quiz' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Quiz Generator ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-pink-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Student Analytics
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'communication' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Parent Chat & Hours
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ALERTS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Welcome Back, {user?.name}! 📚</h2>
              <p className="text-indigo-100 text-sm max-w-2xl">
                Upload lessons, YouTube concept videos, generate AI quizzes, manage student homework submissions, and view color-coded student risk analytics.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Today's Classes</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.todaysClassesCount || 4} Sessions</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Active Homework</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.pendingHomeworksCount || homeworks.length} Assignments</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">AI Quizzes Published</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.quizzesCount || quizzes.length} Quizzes</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Weekly Completion</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.weeklyProgress || 88}% Progress</p>
                </div>
              </div>
            </div>

            {/* Alerts Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Student Progress Alerts
              </h3>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{alert.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LESSON MANAGEMENT */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Lesson Repository</h2>
                <p className="text-xs text-slate-500">Upload notes, PDFs, worksheets, and YouTube videos for students</p>
              </div>
              <button
                onClick={() => setShowLessonModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Upload New Lesson
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => (
                <div key={lesson._id || lesson.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase">
                        {lesson.category} • {lesson.contentType}
                      </span>
                      <button onClick={() => handleDeleteLesson(lesson._id || lesson.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg mb-1">{lesson.title}</h3>
                    <p className="text-xs text-slate-600 mb-4">{lesson.description}</p>

                    {/* YouTube Video Embed Preview */}
                    {lesson.youtubeUrl && (
                      <div className="rounded-2xl overflow-hidden mb-4 border border-slate-200 bg-slate-900 aspect-video relative">
                        <iframe
                          src={lesson.youtubeUrl}
                          title={lesson.title}
                          className="w-full h-full"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{lesson.grade} • {lesson.subject}</span>
                    <span className="font-semibold text-purple-600">{lesson.teacherName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HOMEWORK MODULE */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Homework Assignments & Review</h2>
                <p className="text-xs text-slate-500">Create homework and grade student notebook submissions</p>
              </div>
              <button
                onClick={() => setShowHwModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Homework
              </button>
            </div>

            <div className="space-y-6">
              {homeworks.map((hw) => (
                <div key={hw._id || hw.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                        Due: {hw.dueDate}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-2">{hw.title}</h3>
                      <p className="text-xs text-slate-600">{hw.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Total Marks</p>
                      <p className="text-xl font-black text-slate-900">{hw.totalMarks} pts</p>
                    </div>
                  </div>

                  {/* Submissions Section */}
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3">Student Submissions ({hw.submissions?.length || 0})</h4>
                    {hw.submissions?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No submissions yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hw.submissions?.map((sub: any) => (
                          <div key={sub._id || sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-900 text-sm">{sub.studentName}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 mb-3">{sub.content}</p>
                              {sub.status === 'graded' && (
                                <div className="text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 mb-2">
                                  <strong>Grade:</strong> {sub.marksObtained}/{hw.totalMarks} | <strong>Feedback:</strong> {sub.feedback}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedSub({ hwId: hw._id || hw.id, subId: sub._id || sub.id, name: sub.studentName });
                                setGradingMarks(sub.marksObtained || 90);
                                setGradingFeedback(sub.feedback || 'Great work!');
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs mt-2"
                            >
                              Grade / Review Submission
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI QUIZ GENERATOR */}
        {activeTab === 'ai-quiz' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Subject-Specific AI Assessment Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">AI Quiz Generator ⚡</h2>
              <p className="text-amber-50 text-sm max-w-xl">
                Generate highly targeted, non-repetitive subject quizzes. AI analyzes your Subject, Chapter, Topic, and optional Study Material to build custom MCQs, True/False, Fill-in-the-blanks, and Short Answer questions!
              </p>
            </div>

            {/* AI Generator Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Quiz Configuration
              </h3>
              <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class / Grade Level</label>
                    {user?.grades && user.grades.length > 0 ? (
                      <select
                        value={aiQuizData.grade}
                        onChange={(e) => setAiQuizData({ ...aiQuizData, grade: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                        required
                      >
                        {user.grades.map((g: string) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={aiQuizData.grade}
                        onChange={(e) => setAiQuizData({ ...aiQuizData, grade: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                      >
                        <option value="Grade 1">Grade 1</option>
                        <option value="Grade 2">Grade 2</option>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                    {user?.subjects && user.subjects.length > 0 ? (
                      <select
                        value={aiQuizData.subject}
                        onChange={(e) => setAiQuizData({ ...aiQuizData, subject: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                        required
                      >
                        {user.subjects.map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={aiQuizData.subject}
                        onChange={(e) => setAiQuizData({ ...aiQuizData, subject: e.target.value })}
                        placeholder="e.g. Mathematics, Physics, Biology, Java"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapter Name / No.</label>
                    <input
                      type="text"
                      value={aiQuizData.chapter}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, chapter: e.target.value })}
                      placeholder="e.g. Chapter 4: Equations"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic Name</label>
                    <input
                      type="text"
                      value={aiQuizData.topic}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, topic: e.target.value })}
                      placeholder="e.g. Quadratic Equations, Photosynthesis, Java Classes"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty Level</label>
                    <select
                      value={aiQuizData.difficulty}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, difficulty: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                    >
                      <option value="Easy">Easy (Recall & Definitions)</option>
                      <option value="Medium">Medium (Application)</option>
                      <option value="Hard">Hard (Complex Reasoning)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Question Type</label>
                    <select
                      value={aiQuizData.questionType}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, questionType: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                    >
                      <option value="mixed">Mixed Question Types</option>
                      <option value="mcq">MCQs Only (4 Options)</option>
                      <option value="true_false">True / False Only</option>
                      <option value="fill_blank">Fill in the Blank Only</option>
                      <option value="short">Short Answer Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. of Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={aiQuizData.numberOfQuestions}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, numberOfQuestions: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-indigo-500"
                    />
                  </div>
                </div>

                {/* Uploaded Study Material / Paste Notes Section */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMaterialInput(!showMaterialInput)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showMaterialInput ? '➖ Hide Source Study Material' : '➕ Attach Study Notes / Textbook Material (Optional)'}
                  </button>

                  {showMaterialInput && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Source File / Chapter Name</label>
                        <input
                          type="text"
                          value={aiQuizData.sourceMaterialName}
                          onChange={(e) => setAiQuizData({ ...aiQuizData, sourceMaterialName: e.target.value })}
                          placeholder="e.g. Unit_3_Photosynthesis_Notes.pdf"
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Source Material Text / Notes</label>
                        <textarea
                          rows={4}
                          value={aiQuizData.sourceMaterialText}
                          onChange={(e) => setAiQuizData({ ...aiQuizData, sourceMaterialText: e.target.value })}
                          placeholder="Paste study guide text, textbook excerpt, or notes here..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-indigo-500"
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingQuiz}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-pink-500 text-white font-black rounded-2xl shadow-lg hover:from-amber-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-4"
                >
                  {isGeneratingQuiz ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating your subject-specific quiz...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Generate AI Quiz Preview
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* INTERACTIVE QUIZ PREVIEW COMPONENT */}
            {previewQuiz && (
              <div className="bg-indigo-50 border-2 border-indigo-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-200 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full uppercase">
                        Draft Preview
                      </span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        {previewQuiz.subject} • {previewQuiz.grade}
                      </span>
                      <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                        Ch: {previewQuiz.chapter}
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        Difficulty: {previewQuiz.difficulty}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{previewQuiz.title}</h3>
                    {previewQuiz.sourceMaterialName && (
                      <p className="text-xs text-indigo-700 font-bold mt-1">
                        📄 Questions generated from: <span className="underline">{previewQuiz.sourceMaterialName}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddQuestionToPreview}
                      disabled={regeneratingIndex !== null}
                      className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      ➕ Add Question
                    </button>
                    <button
                      onClick={() => setPreviewQuiz(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Discard Draft
                    </button>
                  </div>
                </div>

                {/* Question List Preview */}
                <div className="space-y-4">
                  {previewQuiz.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      {editingQIndex === idx ? (
                        /* Inline Edit Question Form */
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-500 uppercase">Editing Question #{idx + 1}</p>
                          <textarea
                            rows={2}
                            value={editQForm.question}
                            onChange={(e) => setEditQForm({ ...editQForm, question: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                          ></textarea>

                          {editQForm.type === 'mcq' && (
                            <div className="grid grid-cols-2 gap-2">
                              {editQForm.options?.map((opt: string, optIdx: number) => (
                                <input
                                  key={optIdx}
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...editQForm.options];
                                    opts[optIdx] = e.target.value;
                                    setEditQForm({ ...editQForm, options: opts });
                                  }}
                                  className="p-2 border border-slate-200 rounded-lg text-xs"
                                />
                              ))}
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Correct Answer</label>
                            <input
                              type="text"
                              value={editQForm.correctAnswer}
                              onChange={(e) => setEditQForm({ ...editQForm, correctAnswer: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Explanation</label>
                            <input
                              type="text"
                              value={editQForm.explanation}
                              onChange={(e) => setEditQForm({ ...editQForm, explanation: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-600"
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSaveEditQuestion(idx)}
                              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingQIndex(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Question View */
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                                Q{idx + 1}
                              </span>
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md border border-slate-200">
                                {q.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRegenerateQuestion(idx)}
                                disabled={regeneratingIndex !== null}
                                title="Regenerate this specific question"
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {regeneratingIndex === idx ? (
                                  <div className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>⚡ Regenerate</>
                                )}
                              </button>

                              <button
                                onClick={() => handleStartEditQuestion(idx)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={() => handleDeleteQuestionFromPreview(idx)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm mb-2">{q.question}</h4>

                          {/* Options display */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl text-xs font-semibold border ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}. {opt} {isCorrect && '✓'}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                            <span className="font-bold text-emerald-700">Answer: {q.correctAnswer}</span>
                            {q.explanation && <p className="text-slate-500 mt-0.5">💡 {q.explanation}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-4">
                  <button
                    onClick={handlePublishQuiz}
                    disabled={isSavingQuiz || !previewQuiz.questions.length}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-2xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {isSavingQuiz ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Approve & Publish AI Quiz Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Published Quizzes List */}
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900">Published Quizzes ({quizzes.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((q) => (
                  <div key={q._id || q.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                          {q.difficulty || 'Medium'} • {q.grade}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-semibold">{q.questions?.length || 0} Questions</span>
                          <button
                            onClick={() => handleDeleteQuiz(q._id || q.id)}
                            title="Delete Quiz"
                            className="p-1 text-slate-400 hover:text-rose-600 text-xs cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-900 text-lg">{q.title}</h4>
                      <p className="text-xs text-slate-500 mb-1">
                        Subject: <span className="font-bold text-slate-700">{q.subject}</span> • Chapter: <span className="font-bold text-slate-700">{q.chapter || 'Ch. 1'}</span>
                      </p>
                      <p className="text-xs text-slate-500 mb-3">Topic: <span className="font-bold text-slate-700">{q.topic}</span></p>

                      {q.sourceMaterialName && (
                        <p className="text-[10px] text-indigo-600 font-bold mb-3">
                          📄 Questions generated from: {q.sourceMaterialName}
                        </p>
                      )}

                      <div className="space-y-2 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto pr-1">
                        {q.questions?.map((ques: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs">
                            <p className="font-bold text-slate-800">Q{idx + 1}: {ques.question}</p>
                            <p className="text-emerald-600 font-semibold mt-1">✓ Answer: {ques.correctAnswer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-extrabold text-slate-900 text-lg">Classroom Student Performance & Risk Cards</h2>
              <p className="text-xs text-slate-500">Individual student learning speed, weak/strong topics, and AI intervention plans</p>
            </div>

            {analytics.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  📊
                </div>
                <h3 className="text-lg font-black text-slate-900">No Student Performance Data Available Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Analytics cards are generated dynamically when students enroll, submit homework assignments, and attempt published quizzes.
                </p>
                <div className="p-4 bg-indigo-50/50 rounded-2xl text-[11px] text-indigo-900 border border-indigo-100 text-left space-y-2">
                  <p className="font-extrabold uppercase text-[9px] tracking-wider text-indigo-700">Next Steps for Teachers:</p>
                  <ul className="list-disc pl-4 space-y-1 font-medium">
                    <li>Create and assign homework tasks in the **Homework Module** tab.</li>
                    <li>Generate and publish structured quizzes in the **AI Quiz Generator** tab.</li>
                    <li>Students must log in, complete the assignments, and submit their responses.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.map((st) => (
                  <div key={st.studentId} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            st.riskLevel === 'low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.riskLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {st.riskLevel} Risk
                        </span>
                        <span className="text-xs font-bold text-slate-500">{st.grade}</span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mb-1">{st.studentName}</h3>
                      <p className="text-xs text-slate-500 mb-4">Learning Speed: <strong className="text-slate-800">{st.learningSpeed}</strong></p>

                      {/* Progress Metrics */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl mb-4 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Attendance</p>
                          <p className="text-base font-black text-slate-900">{st.attendance}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Homework</p>
                          <p className="text-base font-black text-slate-900">{st.homeworkCompletion}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Quiz Avg</p>
                          <p className="text-base font-black text-indigo-600">{st.quizAverage}%</p>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="space-y-2 text-xs mb-4">
                        <div>
                          <span className="font-bold text-rose-600">Weak Topics: </span>
                          <span className="text-slate-700">{st.weakTopics?.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-bold text-emerald-600">Strong Topics: </span>
                          <span className="text-slate-700">{st.strongTopics?.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation Box */}
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
                      <strong className="flex items-center gap-1 text-purple-700 mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Recommendation:
                      </strong>
                      {st.aiRecommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PARENT COMMUNICATION */}
        {activeTab === 'communication' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Parent Communication & Working Hours</h2>
                <p className="text-xs text-slate-500 mt-0.5">Communication is active strictly between 9:00 AM and 4:00 PM.</p>
              </div>
              <div
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold ${
                  workingHours.isWorkingHours ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {workingHours.message}
              </div>
            </div>

            {/* Announcements Board */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-base mb-4">Classroom Announcements</h3>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                      <p className="text-xs text-slate-500">Target: {ann.target}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">{ann.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LESSON UPLOAD MODAL */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowLessonModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Upload New Lesson</h2>
            <form onSubmit={handleCreateLesson} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  placeholder="e.g. Fractions & Visual Diagrams"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={lessonData.description}
                  onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                  placeholder="Lesson summary..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={lessonData.category}
                    onChange={(e) => setLessonData({ ...lessonData, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="daily">Daily Concept</option>
                    <option value="weekly">Weekly Concept</option>
                    <option value="notes">Notes</option>
                    <option value="worksheet">Worksheet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Content Type</label>
                  <select
                    value={lessonData.contentType}
                    onChange={(e) => setLessonData({ ...lessonData, contentType: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="video">YouTube Video</option>
                    <option value="pdf">PDF File</option>
                    <option value="image">Image / Diagram</option>
                    <option value="text">Text Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">YouTube Embed URL</label>
                <input
                  type="text"
                  value={lessonData.youtubeUrl}
                  onChange={(e) => setLessonData({ ...lessonData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 shadow-md mt-4">
                Publish Lesson Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HOMEWORK MODAL */}
      {showHwModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowHwModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Create Homework Assignment</h2>
            <form onSubmit={handleCreateHomework} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={hwData.title}
                  onChange={(e) => setHwData({ ...hwData, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={hwData.description}
                  onChange={(e) => setHwData({ ...hwData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={hwData.dueDate}
                    onChange={(e) => setHwData({ ...hwData, dueDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={hwData.totalMarks}
                    onChange={(e) => setHwData({ ...hwData, totalMarks: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-md mt-4">
                Assign Homework
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setSelectedSub(null)} className="absolute right-4 top-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-3">Grade {selectedSub.name}'s Work</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marks Obtained</label>
                <input
                  type="number"
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Feedback</label>
                <textarea
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                ></textarea>
              </div>
              <button
                onClick={() => handleSaveGrade(selectedSub.hwId, selectedSub.subId)}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Save Grade & Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
