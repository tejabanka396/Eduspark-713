import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { validateYouTubeUrl, extractYouTubeVideoId } from '../../utils/youtube';
import {
  Sparkles,
  Plus,
  Video,
  BarChart2,
  BarChart3,
  X,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Play,
  FileCheck,
  BookOpen,
  Calendar,
  Users,
  Search,
  ExternalLink,
  RefreshCw,
  Clock,
  Menu,
  HelpCircle,
  MessageSquare,
  Send,
  User,
  Settings as SettingsIcon,
  Check,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Route extraction: e.g. /teacher/lessons -> 'lessons', /teacher -> 'overview'
  const subRoute = location.pathname.replace('/teacher', '').replace(/^\//, '') || 'overview';

  // Core Data
  const [stats, setStats] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<any>({ assignedClasses: [], assignedSubjects: [], curriculum: {} });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Video Management Modals & State
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [isEditingVideo, setIsEditingVideo] = useState<boolean>(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState<any>({
    title: '',
    youtubeUrl: '',
    className: 'Grade 4 - Alpha',
    subject: 'Mathematics',
    chapter: '',
    topic: '',
    description: '',
  });
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [videoPreviewId, setVideoPreviewId] = useState<string | null>(null);
  const [isSavingVideo, setIsSavingVideo] = useState<boolean>(false);

  // Delete Confirmation Modal
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Watch Video Modal
  const [watchingVideo, setWatchingVideo] = useState<any | null>(null);

  // Homework Modal State
  const [showHwModal, setShowHwModal] = useState<boolean>(false);
  const [hwData, setHwData] = useState<any>({
    title: '',
    description: '',
    grade: 'Grade 4',
    subject: 'Mathematics',
    dueDate: '2026-08-15',
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
    chapter: 'Chapter 1: Fractions & Decimals',
    topic: 'Equivalent Fractions',
    difficulty: 'Medium',
    questionType: 'mixed',
    numberOfQuestions: 4,
    totalMarks: 10,
    sourceMaterialName: '',
    sourceMaterialText: '',
  });
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [previewQuiz, setPreviewQuiz] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  // Update curriculum defaults once loaded
  useEffect(() => {
    if (curriculum.assignedClasses?.length > 0) {
      const defaultClass = curriculum.assignedClasses[0];
      const defaultSubj = curriculum.assignedSubjects[0] || 'Mathematics';
      const availableChapters = curriculum.curriculum[defaultClass]?.[defaultSubj] || [];
      const defaultChap = availableChapters[0]?.chapter || '';
      const defaultTop = availableChapters[0]?.topics?.[0] || '';

      setVideoForm((prev: any) => ({
        ...prev,
        className: prev.className || defaultClass,
        subject: prev.subject || defaultSubj,
        chapter: prev.chapter || defaultChap,
        topic: prev.topic || defaultTop,
      }));

      setAiQuizData((prev: any) => ({
        ...prev,
        grade: defaultClass,
        subject: defaultSubj,
        chapter: defaultChap,
        topic: defaultTop,
      }));
    }
  }, [curriculum]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, currRes, lessonsRes, hwRes, quizzesRes, analyticsRes] = await Promise.all([
        fetchApi<any>('/teacher/stats').catch(() => null),
        fetchApi<any>('/teacher/curriculum').catch(() => null),
        fetchApi<any>('/teacher/videos').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/homeworks').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/quizzes').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/analytics').catch(() => ({ data: [] })),
      ]);

      if (statsRes && statsRes.success) setStats(statsRes.stats);
      if (currRes && currRes.success) setCurriculum(currRes);
      setLessons(lessonsRes.data || []);
      setHomeworks(hwRes.data || []);
      setQuizzes(quizzesRes.data || []);
      setAnalytics(analyticsRes.data || []);
    } catch (err: any) {
      console.error('Error loading teacher data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Video URL Change & Live Preview Handler
  const handleUrlChange = (url: string) => {
    setVideoForm((prev: any) => ({ ...prev, youtubeUrl: url }));
    if (!url.trim()) {
      setVideoUrlError(null);
      setVideoPreviewId(null);
      return;
    }
    const check = validateYouTubeUrl(url);
    if (!check.isValid) {
      setVideoUrlError('Please enter a valid YouTube video URL.');
      setVideoPreviewId(null);
    } else {
      setVideoUrlError(null);
      setVideoPreviewId(check.videoId);
    }
  };

  // Dynamic Chapter & Topic getters
  const getChaptersForCurrentSelection = () => {
    const cls = videoForm.className || curriculum.assignedClasses?.[0] || 'Grade 4 - Alpha';
    const subj = videoForm.subject || curriculum.assignedSubjects?.[0] || 'Mathematics';
    return curriculum.curriculum?.[cls]?.[subj] || [];
  };

  const getTopicsForCurrentChapter = () => {
    const chapters = getChaptersForCurrentSelection();
    const current = chapters.find((c: any) => c.chapter === videoForm.chapter);
    return current ? current.topics : [];
  };

  // Open Add Video Modal
  const openAddVideoModal = () => {
    setIsEditingVideo(false);
    setEditingVideoId(null);
    const defaultClass = curriculum.assignedClasses?.[0] || 'Grade 4 - Alpha';
    const defaultSubj = curriculum.assignedSubjects?.[0] || 'Mathematics';
    const chapters = curriculum.curriculum?.[defaultClass]?.[defaultSubj] || [];
    const defaultChap = chapters[0]?.chapter || 'Chapter 1: Fractions & Decimals';
    const defaultTop = chapters[0]?.topics?.[0] || 'Basic Fractions';

    setVideoForm({
      title: '',
      youtubeUrl: '',
      className: defaultClass,
      subject: defaultSubj,
      chapter: defaultChap,
      topic: defaultTop,
      description: '',
    });
    setVideoUrlError(null);
    setVideoPreviewId(null);
    setShowVideoModal(true);
  };

  // Open Edit Video Modal
  const openEditVideoModal = (video: any) => {
    setIsEditingVideo(true);
    setEditingVideoId(video._id || video.id);
    const ytId = video.youtubeVideoId || extractYouTubeVideoId(video.youtubeUrl);
    setVideoForm({
      title: video.title || '',
      youtubeUrl: video.youtubeUrl || '',
      className: video.className || video.grade || curriculum.assignedClasses?.[0] || 'Grade 4 - Alpha',
      subject: video.subject || curriculum.assignedSubjects?.[0] || 'Mathematics',
      chapter: video.chapter || '',
      topic: video.topic || '',
      description: video.description || '',
    });
    setVideoPreviewId(ytId);
    setVideoUrlError(null);
    setShowVideoModal(true);
  };

  // Save / Update Video
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title.trim()) {
      showToast('Video title is required.', 'error');
      return;
    }

    const check = validateYouTubeUrl(videoForm.youtubeUrl);
    if (!check.isValid) {
      setVideoUrlError('Please enter a valid YouTube video URL.');
      showToast('Please enter a valid YouTube video URL.', 'error');
      return;
    }

    setIsSavingVideo(true);
    try {
      if (isEditingVideo && editingVideoId) {
        const res = await fetchApi<any>(`/teacher/videos/${editingVideoId}`, {
          method: 'PUT',
          body: JSON.stringify(videoForm),
        });
        if (res.success) {
          showToast('Video updated successfully!', 'success');
          setShowVideoModal(false);
          loadAllData();
        }
      } else {
        const res = await fetchApi<any>('/teacher/videos', {
          method: 'POST',
          body: JSON.stringify(videoForm),
        });
        if (res.success) {
          showToast('YouTube video added successfully!', 'success');
          setShowVideoModal(false);
          loadAllData();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save video.', 'error');
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Confirm and Execute Delete Video
  const handleConfirmDelete = async () => {
    if (!deletingVideoId) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi<any>(`/teacher/videos/${deletingVideoId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('Video deleted successfully.', 'success');
        setDeletingVideoId(null);
        setLessons((prev) => prev.filter((l) => (l._id || l.id) !== deletingVideoId));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete video.', 'error');
    } finally {
      setIsDeleting(false);
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
        showToast('Homework created successfully!', 'success');
        setShowHwModal(false);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating homework.', 'error');
    }
  };

  // Submit Grading
  const handleGradeSubmit = async () => {
    if (!selectedSub) return;
    try {
      const res = await fetchApi<any>(`/teacher/homeworks/${selectedSub.hwId}/grade/${selectedSub.submissionId}`, {
        method: 'PUT',
        body: JSON.stringify({ marks: gradingMarks, feedback: gradingFeedback }),
      });
      if (res.success) {
        showToast('Grade submitted successfully!', 'success');
        setSelectedSub(null);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit grade.', 'error');
    }
  };

  // Generate AI Quiz
  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const res = await fetchApi<any>('/teacher/quizzes/generate-ai', {
        method: 'POST',
        body: JSON.stringify(aiQuizData),
      });
      if (res.success) {
        setPreviewQuiz(res.data);
        showToast('✨ AI Quiz generated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error generating quiz.', 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Publish Generated Quiz
  const handlePublishQuiz = async () => {
    if (!previewQuiz) return;
    try {
      const res = await fetchApi<any>('/teacher/quizzes/save', {
        method: 'POST',
        body: JSON.stringify({ ...previewQuiz, isPublished: true }),
      });
      if (res.success) {
        showToast('Quiz published successfully!', 'success');
        setPreviewQuiz(null);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish quiz.', 'error');
    }
  };

  const teacherName = user?.name || 'Ms. Priya Sharma';
  const teacherIdDisplay = (user as any)?.teacherId || 'TCH001';
  const teacherPrimarySubject = (user as any)?.subject || (user as any)?.subjects?.[0] || 'Mathematics';
  const teacherAssignedClass = (user as any)?.assignedClass || 'Class 3 & 4';

  const isOverview = subRoute === 'overview' || subRoute === '' || subRoute === 'dashboard';
  const isLessons = subRoute === 'lessons';
  const isHomework = subRoute === 'homework';
  const isQuizzes = subRoute === 'quizzes';
  const isAnalytics = subRoute === 'analytics';
  const isParents = subRoute === 'parents';
  const isSettings = subRoute === 'settings';

  return (
    <DashboardLayout role="teacher" pageTitle="Teacher Workspace">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm flex items-center gap-2 animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {isOverview && (
        <div className="space-y-6">
              {/* Teacher Profile Summary Card (Matching Panel 3 Reference) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-3xl shrink-0 shadow-xs">
                    👩‍🏫
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-slate-900">{teacherName}</h1>
                      <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Teacher ID: {teacherIdDisplay}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {teacherPrimarySubject} Teacher • {teacherAssignedClass}
                    </p>
                  </div>
                </div>

                <button
                  onClick={openAddVideoModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add YouTube Video
                </button>
              </div>

              {/* 4 Metrics Row (Matching Panel 3 Reference) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-500 mb-1">Today's Classes</p>
                  <h3 className="text-2xl font-black text-slate-900">22</h3>
                  <button onClick={() => setActiveTab('classes')} className="text-[11px] text-blue-600 font-bold hover:underline mt-2 inline-block cursor-pointer">
                    View Schedule →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-500 mb-1">Total Students</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats?.totalStudents || 48}</h3>
                  <button onClick={() => setActiveTab('students')} className="text-[11px] text-blue-600 font-bold hover:underline mt-2 inline-block cursor-pointer">
                    View Students →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-500 mb-1">Pending Homework</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats?.homeworksCount || 5}</h3>
                  <button onClick={() => setActiveTab('homework')} className="text-[11px] text-blue-600 font-bold hover:underline mt-2 inline-block cursor-pointer">
                    View All →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-500 mb-1">Recent Quizzes</p>
                  <h3 className="text-2xl font-black text-slate-900">{quizzes.length || 3}</h3>
                  <button onClick={() => navigate('/teacher/quizzes')} className="text-[11px] text-blue-600 font-bold hover:underline mt-2 inline-block cursor-pointer">
                    View All →
                  </button>
                </div>
              </div>

              {/* 4 Quick Action Cards (Matching Panel 3 Reference) */}
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Action 1: Add YouTube Video */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                        <Video className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Add YouTube Video</h4>
                      <p className="text-xs text-slate-500 mt-1">Upload educational videos for your students</p>
                    </div>
                    <button
                      onClick={openAddVideoModal}
                      className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Add Video
                    </button>
                  </div>

                  {/* Action 2: Lesson Uploads */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-3">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Lesson Uploads</h4>
                      <p className="text-xs text-slate-500 mt-1">Share notes, PDFs, resources</p>
                    </div>
                    <button
                      onClick={() => navigate('/teacher/lessons')}
                      className="w-full mt-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Upload
                    </button>
                  </div>

                  {/* Action 3: Homework */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Homework</h4>
                      <p className="text-xs text-slate-500 mt-1">Create and manage homework</p>
                    </div>
                    <button
                      onClick={() => setShowHwModal(true)}
                      className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Create
                    </button>
                  </div>

                  {/* Action 4: AI Quiz Generator */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">AI Quiz Generator</h4>
                      <p className="text-xs text-slate-500 mt-1">Generate quizzes with AI</p>
                    </div>
                    <button
                      onClick={() => navigate('/teacher/quizzes')}
                      className="w-full mt-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Student Insights & Recent Activity (Matching Panel 3 Reference) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Insights Box */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <BarChart2 className="w-5 h-5" />
                      <h3 className="font-extrabold text-slate-900 text-base">Student Insights</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">View performance and identify students needing attention</p>
                    
                    <div className="space-y-3">
                      {analytics.slice(0, 3).map((st: any, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-800">{st.studentName}</p>
                            <p className="text-[11px] text-slate-500">Weak Topics: {st.weakTopics?.join(', ') || 'None'}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.score < 70 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {st.score}% Avg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/teacher/analytics')}
                    className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    View Insights
                  </button>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="font-extrabold text-slate-900 text-base mb-3">Recent Activity</h3>
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">New homework assigned - Chapter 5</p>
                        <p className="text-[11px] text-slate-400">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">Quiz completed - Fractions</p>
                        <p className="text-[11px] text-slate-400">4 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">YouTube video added - Algebra Basics</p>
                        <p className="text-[11px] text-slate-400">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LESSONS & YOUTUBE VIDEOS (CRUD) */}
          {isLessons && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg">YouTube Educational Videos & Lessons</h2>
                  <p className="text-xs text-slate-500">Manage video resources and concept lessons for your students</p>
                </div>
                <button
                  onClick={openAddVideoModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add YouTube Video
                </button>
              </div>

              {lessons.length === 0 ? (
                /* Empty State matching Requirement 15 */
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg mb-1">No videos added yet.</h3>
                  <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                    Add an educational YouTube video to help your students learn.
                  </p>
                  <button
                    onClick={openAddVideoModal}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add YouTube Video
                  </button>
                </div>
              ) : (
                /* Grid of Video Cards (Requirement 10) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lessons.map((lesson) => {
                    const videoId = lesson.youtubeVideoId || extractYouTubeVideoId(lesson.youtubeUrl);
                    const thumbnail = lesson.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '');

                    return (
                      <div
                        key={lesson._id || lesson.id}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          {/* Thumbnail Container */}
                          <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                            {thumbnail ? (
                              <img src={thumbnail} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <Video className="w-10 h-10" />
                              </div>
                            )}
                            <button
                              onClick={() => setWatchingVideo(lesson)}
                              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </button>
                          </div>

                          {/* Card Content */}
                          <div className="p-5">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                                {lesson.subject}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                {lesson.className || lesson.grade}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-base mb-1 line-clamp-1">{lesson.title}</h3>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{lesson.description || 'Educational concept video.'}</p>

                            <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-100 pt-2.5">
                              <p><span className="font-semibold text-slate-600">Chapter:</span> {lesson.chapter || 'Chapter 1'}</p>
                              <p><span className="font-semibold text-slate-600">Topic:</span> {lesson.topic || 'General Topic'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setWatchingVideo(lesson)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" /> Watch
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditVideoModal(lesson)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Edit Video"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingVideoId(lesson._id || lesson.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOMEWORK MODULE */}
          {isHomework && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg">Homework Assignments & Reviews</h2>
                  <p className="text-xs text-slate-500">Create homework assignments and evaluate student submissions</p>
                </div>
                <button
                  onClick={() => setShowHwModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Create Homework
                </button>
              </div>

              <div className="space-y-4">
                {homeworks.map((hw) => (
                  <div key={hw._id || hw.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                          Due: {hw.dueDate}
                        </span>
                        <h3 className="font-black text-slate-900 text-base mt-1">{hw.title}</h3>
                        <p className="text-xs text-slate-500">{hw.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Total Marks</p>
                        <p className="text-base font-black text-slate-800">{hw.totalMarks} pts</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-700 mb-2">
                        Submissions ({hw.submissions?.length || 0})
                      </h4>
                      {hw.submissions?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No submissions yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {hw.submissions?.map((sub: any) => (
                            <div key={sub._id || sub.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-slate-800">{sub.studentName}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  {sub.status || 'submitted'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mb-3">{sub.content}</p>
                              <button
                                onClick={() => {
                                  setSelectedSub({ hwId: hw._id || hw.id, submissionId: sub._id || sub.id, sub });
                                  setGradingMarks(sub.marksObtained || 90);
                                  setGradingFeedback(sub.feedback || 'Well done!');
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 cursor-pointer"
                              >
                                Grade Submission
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
          {isQuizzes && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="font-black text-slate-900 text-lg">AI Quiz Generator</h2>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Generate targeted, syllabus-accurate quizzes with zero cross-subject hallucination and smart deduplication.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class</label>
                    <select
                      value={aiQuizData.grade}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, grade: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      {curriculum.assignedClasses?.map((cls: string) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                    <select
                      value={aiQuizData.subject}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, subject: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      {curriculum.assignedSubjects?.map((subj: string) => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapter</label>
                    <input
                      type="text"
                      value={aiQuizData.chapter}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, chapter: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic</label>
                    <input
                      type="text"
                      value={aiQuizData.topic}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, topic: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty</label>
                    <select
                      value={aiQuizData.difficulty}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, difficulty: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Number of Questions</label>
                    <select
                      value={aiQuizData.numberOfQuestions}
                      onChange={(e) => setAiQuizData({ ...aiQuizData, numberOfQuestions: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={4}>4 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Quiz
                    </>
                  )}
                </button>
              </div>

              {/* Quiz Preview */}
              {previewQuiz && (
                <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{previewQuiz.title}</h3>
                      <p className="text-xs text-slate-500">
                        {previewQuiz.grade} • {previewQuiz.subject} • {previewQuiz.chapter} • {previewQuiz.topic}
                      </p>
                    </div>
                    <button
                      onClick={handlePublishQuiz}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                    >
                      Publish Quiz
                    </button>
                  </div>

                  <div className="space-y-3">
                    {previewQuiz.questions?.map((q: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="font-bold text-xs text-slate-900 mb-2">
                          Q{idx + 1}: {q.question}
                        </p>
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-lg text-xs ${
                                  opt === q.correctAnswer
                                    ? 'bg-emerald-100 font-bold text-emerald-800 border border-emerald-300'
                                    : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Answer:</span> {q.correctAnswer} • <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI INSIGHTS */}
          {isAnalytics && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-black text-slate-900 text-lg">Student Performance Analytics & Early Alerts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.map((st: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-slate-900">{st.studentName}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.score < 70 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {st.score}% Avg
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Grade: {st.grade}</p>
                      <p className="text-xs text-rose-600 font-medium">Weak Topics: {st.weakTopics?.join(', ') || 'None'}</p>
                      <p className="text-xs text-emerald-600 font-medium">Strong Topics: {st.strongTopics?.join(', ') || 'All core concepts'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CLASSES */}
          {subRoute === 'classes' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h2 className="font-black text-slate-900 text-lg mb-4">Assigned Classes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {curriculum.assignedClasses?.map((cls: string, idx: number) => (
                  <div key={idx} className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200">
                    <h4 className="font-extrabold text-blue-900 text-base">{cls}</h4>
                    <p className="text-xs text-blue-700 mt-1">Subjects: {curriculum.assignedSubjects?.join(', ')}</p>
                    <p className="text-[11px] text-slate-500 mt-2">Active Class assigned to {teacherName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PARENT CHAT & COMMUNICATIONS */}
          {isParents && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-lg">Parent Communications & Chat</h2>
                    <p className="text-xs text-slate-500">Direct academic communication with parents regarding student progress and inquiries</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
                    Office Hours Active (09:00 AM - 04:00 PM)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Parent Inquiries List */}
                  <div className="space-y-2 border-r border-slate-100 pr-0 md:pr-4">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Recent Parent Inquiries</h3>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">Eleanor Vance</span>
                        <span className="text-[10px] text-blue-600 font-bold">10m ago</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">"Thank you for the update on Leo's Math homework."</p>
                      <span className="text-[10px] text-slate-400">Parent of Leo Vance (Grade 4)</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">Anita Sharma</span>
                        <span className="text-[10px] text-slate-400">2h ago</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">"Could we schedule a 10-minute review session?"</p>
                      <span className="text-[10px] text-slate-400">Parent of Rohan Sharma (Grade 4)</span>
                    </div>
                  </div>

                  {/* Active Chat Conversation */}
                  <div className="md:col-span-2 flex flex-col h-[420px] justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 pb-2 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          E
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">Eleanor Vance</h4>
                          <p className="text-[10px] text-slate-500">Parent of Leo Vance • Grade 4</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Online
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
                      <div className="bg-white p-3 rounded-2xl max-w-md shadow-2xs border border-slate-200 text-xs text-slate-700">
                        <p className="font-bold text-[10px] text-slate-400 mb-0.5">Eleanor Vance • 09:30 AM</p>
                        Hello Prof. Keating, I wanted to ask about the upcoming chapter test on fractions. Leo was asking about extra practice problems.
                      </div>
                      <div className="bg-blue-600 text-white p-3 rounded-2xl max-w-md ml-auto shadow-2xs text-xs">
                        <p className="font-bold text-[10px] text-blue-200 mb-0.5">You • 09:35 AM</p>
                        Hello Mrs. Vance! I just uploaded an educational YouTube concept video and generated practice quiz questions in the student portal for Leo.
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        placeholder="Type a message to Eleanor Vance..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer">
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {isSettings && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-3xl">
                <h2 className="font-extrabold text-slate-900 text-lg mb-1">Teacher Account Settings</h2>
                <p className="text-xs text-slate-500 mb-6">Manage your teacher profile and academic notification settings</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={teacherName}
                        readOnly
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || 'teacher@eduspark.ai'}
                        readOnly
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Subject</label>
                      <input
                        type="text"
                        value={teacherPrimarySubject}
                        readOnly
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Grade</label>
                      <input
                        type="text"
                        value={teacherAssignedClass}
                        readOnly
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Homework Submission Alerts</h4>
                      <p className="text-[11px] text-slate-500">Receive notifications when students submit homework assignments</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                      Enabled
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Parent Direct Messages</h4>
                      <p className="text-[11px] text-slate-500">Allow parents to send inquiries during school office hours</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* ==========================================
          ADD / EDIT YOUTUBE VIDEO MODAL
          ========================================== */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {isEditingVideo ? 'Edit YouTube Video' : 'Add YouTube Video'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Enter video title, YouTube URL, and associate with the correct class and curriculum topic.
            </p>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Video Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  placeholder="e.g. Introduction to Equivalent Fractions"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">YouTube URL *</label>
                <input
                  type="text"
                  value={videoForm.youtubeUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                    videoUrlError ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
                {videoUrlError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {videoUrlError}
                  </p>
                )}
              </div>

              {/* YouTube Video Preview Box (Requirement 9) */}
              {videoPreviewId && (
                <div>
                  <label className="block text-xs font-bold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Live YouTube Preview
                  </label>
                  <div className="rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-200 relative shadow-xs">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoPreviewId}`}
                      title="YouTube Preview"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Class & Subject Dropdowns (Assigned only) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class *</label>
                  <select
                    value={videoForm.className}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      const chapters = curriculum.curriculum?.[newCls]?.[videoForm.subject] || [];
                      setVideoForm({
                        ...videoForm,
                        className: newCls,
                        chapter: chapters[0]?.chapter || '',
                        topic: chapters[0]?.topics?.[0] || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {curriculum.assignedClasses?.map((cls: string) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject *</label>
                  <select
                    value={videoForm.subject}
                    onChange={(e) => {
                      const newSubj = e.target.value;
                      const chapters = curriculum.curriculum?.[videoForm.className]?.[newSubj] || [];
                      setVideoForm({
                        ...videoForm,
                        subject: newSubj,
                        chapter: chapters[0]?.chapter || '',
                        topic: chapters[0]?.topics?.[0] || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {curriculum.assignedSubjects?.map((subj: string) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter & Topic Cascades (Requirement 2) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chapter *</label>
                  <select
                    value={videoForm.chapter}
                    onChange={(e) => {
                      const newChap = e.target.value;
                      const chapters = getChaptersForCurrentSelection();
                      const chapObj = chapters.find((c: any) => c.chapter === newChap);
                      setVideoForm({
                        ...videoForm,
                        chapter: newChap,
                        topic: chapObj?.topics?.[0] || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {getChaptersForCurrentSelection().map((c: any, idx: number) => (
                      <option key={idx} value={c.chapter}>{c.chapter}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic *</label>
                  <select
                    value={videoForm.topic}
                    onChange={(e) => setVideoForm({ ...videoForm, topic: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {getTopicsForCurrentChapter().map((t: string, idx: number) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Key concepts explained in this video..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSavingVideo || !!videoUrlError}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {isSavingVideo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Video...</span>
                  </>
                ) : (
                  <span>{isEditingVideo ? 'Save Changes' : 'Add Video'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL (Requirement 12)
          ========================================== */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Are you sure you want to delete this video?</h3>
            <p className="text-xs text-slate-500 mb-6">
              This action will remove the video record from both the Teacher and Student dashboards.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeletingVideoId(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WATCH VIDEO PLAYER MODAL
          ========================================== */}
      {watchingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setWatchingVideo(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-900 text-base mb-1">{watchingVideo.title}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {watchingVideo.subject} • {watchingVideo.className || watchingVideo.grade} • {watchingVideo.chapter} • {watchingVideo.topic}
            </p>

            <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${watchingVideo.youtubeVideoId || extractYouTubeVideoId(watchingVideo.youtubeUrl)}?autoplay=1`}
                title={watchingVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CREATE HOMEWORK MODAL
          ========================================== */}
      {showHwModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowHwModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-4">Create Homework Assignment</h2>
            <form onSubmit={handleCreateHomework} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={hwData.title}
                  onChange={(e) => setHwData({ ...hwData, title: e.target.value })}
                  placeholder="e.g. Chapter 1 Practice Questions"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={hwData.description}
                  onChange={(e) => setHwData({ ...hwData, description: e.target.value })}
                  placeholder="Instructions for students..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={hwData.totalMarks}
                    onChange={(e) => setHwData({ ...hwData, totalMarks: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer mt-3"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          GRADING MODAL
          ========================================== */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-slate-900 text-base mb-1">Grade Student Submission</h3>
            <p className="text-xs text-slate-500 mb-4">Student: {selectedSub.sub.studentName}</p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4">
              <span className="font-bold">Student Response:</span> {selectedSub.sub.content}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marks Obtained (out of 100)</label>
                <input
                  type="number"
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Feedback</label>
                <textarea
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                ></textarea>
              </div>

              <button
                onClick={handleGradeSubmit}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Submit Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
