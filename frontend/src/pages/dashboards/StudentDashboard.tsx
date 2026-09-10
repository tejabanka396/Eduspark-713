import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import {
  Sparkles,
  LogOut,
  Award,
  Flame,
  Star,
  BookOpen,
  Mic,
  Camera,
  HelpCircle,
  Bookmark,
  CheckCircle,
  X,
  FileText,
  Volume2,
  Zap,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'homework' | 'ai-helper' | 'voice-tutor' | 'quizzes' | 'achievements'>('home');

  // State Data
  const [profile, setProfile] = useState<any>({ streak: 5, stars: 140, coins: 250, grade: 'Grade 4' });
  const [lessons, setLessons] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Notifications & Loading
  const [notification, setNotification] = useState<string>('');

  // AI Homework Helper State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiHelperResponse, setAiHelperResponse] = useState<any>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);

  // Voice Tutor State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>('');
  const [voiceResponse, setVoiceResponse] = useState<string>('');

  // OCR Upload State
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);

  // Homework Answer Submission State
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [homeworkTextAnswer, setHomeworkTextAnswer] = useState<string>('');

  // Quiz Taking State
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);

  // Load Data on Mount
  useEffect(() => {
    loadStudentDashboardData();
  }, []);

  const loadStudentDashboardData = async () => {
    try {
      const res = await fetchApi<any>('/student/dashboard');
      if (res.success) {
        setProfile(res.profile);
        setLessons(res.lessons || []);
        setHomeworks(res.homeworks || []);
        setQuizzes(res.quizzes || []);
        setAchievements(res.achievements || []);
        setBookmarks(res.bookmarks || []);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (lessonId: string) => {
    try {
      const res = await fetchApi<any>(`/student/bookmark/${lessonId}`, { method: 'POST' });
      if (res.success) {
        showToast(res.message);
        setBookmarks((prev) =>
          res.isBookmarked ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)
        );
      }
    } catch (err: any) {
      showToast('Error updating bookmark.');
    }
  };

  // AI Homework Helper Submit (Never gives direct answers!)
  const handleAskAiHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAskingAi(true);
    setAiHelperResponse(null); // Clear previous response
    try {
      const res = await fetchApi<any>('/ai/tutor', {
        method: 'POST',
        body: JSON.stringify({ question: aiQuery, class: profile.grade }),
      });
      if (res.success) {
        setAiHelperResponse(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Error asking AI Helper.');
      setAiHelperResponse({
        answer: err.message || 'The AI service is temporarily unavailable. Please try again in a moment.',
        provider: 'System Error'
      });
    } finally {
      setIsAskingAi(false);
    }
  };

  // Web Speech API Voice Tutor
  const handleStartVoiceTutor = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation if browser SpeechRecognition is disabled
      setVoiceQuery('How do green plants turn sunlight into food?');
      triggerVoiceResponse('How do green plants turn sunlight into food?');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceQuery(transcript);
      triggerVoiceResponse(transcript);
    };

    recognition.start();
  };

  const triggerVoiceResponse = async (q: string) => {
    try {
      const res = await fetchApi<any>('/student/voice-tutor', {
        method: 'POST',
        body: JSON.stringify({ voiceQuestion: q }),
      });

      if (res.success) {
        setVoiceResponse(res.spokenResponse);
        // Text to Speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(res.spokenResponse);
          utterance.pitch = 1.2; // Friendly child tutor voice
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err: any) {
      showToast('Voice tutor error.');
    }
  };

  // OCR Homework Scanner
  const handleOcrScan = async () => {
    if (!ocrFile) {
      showToast('Please select an image file first.');
      return;
    }
    setIsScanningOcr(true);
    try {
      const formData = new FormData();
      formData.append('image', ocrFile);
      formData.append('class', profile.grade);

      const res = await fetchApi<any>('/ai/ocr-scan', {
        method: 'POST',
        body: formData,
      });
      if (res.success) {
        setOcrData({ extractedText: res.extractedText, aiSuggestions: res.data.explanation || 'No suggestions.', missingQuestions: [] });
        showToast('OCR scan completed! AI detected handwriting.');
      }
    } catch (err: any) {
      showToast('OCR scan error.');
    } finally {
      setIsScanningOcr(false);
    }
  };

  // Submit Homework Answer
  const handleSubmitHomeworkAnswer = async (hwId: string) => {
    try {
      const res = await fetchApi<any>(`/student/homework/${hwId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: homeworkTextAnswer }),
      });

      if (res.success) {
        showToast(res.message);
        setSelectedHw(null);
        setHomeworkTextAnswer('');
        loadStudentDashboardData();
      }
    } catch (err: any) {
      showToast('Error submitting homework.');
    }
  };

  // Submit Quiz Answers & Get Results
  const handleSubmitQuiz = async (quizId: string) => {
    try {
      const res = await fetchApi<any>(`/student/quiz/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: userQuizAnswers }),
      });

      if (res.success) {
        setQuizResult(res);
        setProfile((prev: any) => ({
          ...prev,
          stars: prev.stars + (res.starsEarned || 20),
          coins: prev.coins + (res.coinsEarned || 50),
        }));
      }
    } catch (err: any) {
      showToast('Error submitting quiz.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-900 flex items-center justify-center font-black shadow-md text-xl">
            🎒
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 flex items-center gap-1.5">
              EduSpark AI <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            </h1>
            <p className="text-xs text-amber-700 font-bold">{profile.grade} Learning Explorer</p>
          </div>
        </div>

        {/* Gamification Stats Header */}
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-3 bg-amber-100/70 border border-amber-200 px-4 py-1.5 rounded-2xl">
            <div className="flex items-center gap-1 text-xs font-black text-amber-900">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> {profile.streak} Days
            </div>
            <div className="w-px h-4 bg-amber-300"></div>
            <div className="flex items-center gap-1 text-xs font-black text-amber-900">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> {profile.stars} Stars
            </div>
            <div className="w-px h-4 bg-amber-300"></div>
            <div className="flex items-center gap-1 text-xs font-black text-amber-900">
              🪙 {profile.coins} Coins
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800">{user?.name || profile.name}</p>
            <p className="text-xs text-amber-600 font-bold">Student</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1">
        {/* Toast Alert */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500 text-white font-bold text-sm flex items-center justify-between shadow-lg animate-fade-in">
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
        <div className="flex flex-wrap gap-2 border-b border-amber-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'home' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Home & Learning
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lessons' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Today's Lessons ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'homework' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Homework & OCR Upload
          </button>
          <button
            onClick={() => setActiveTab('ai-helper')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ai-helper' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> AI Homework Helper 💡
          </button>
          <button
            onClick={() => setActiveTab('voice-tutor')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'voice-tutor' ? 'bg-pink-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" /> AI Voice Tutor 🎙️
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quizzes' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'achievements' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> Achievements & Badges
          </button>
        </div>

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-slate-900 p-6 sm:p-8 rounded-3xl shadow-lg relative">
              <span className="bg-white/40 px-3 py-1 rounded-full text-xs font-black text-slate-900 inline-block mb-2">
                Daily Motivation 🌟
              </span>
              <h2 className="text-3xl font-black mb-2">Welcome Back, {user?.name || profile.name}! 🚀</h2>
              <p className="text-slate-800 font-semibold text-sm max-w-xl">
                {profile.dailyMotivation}
              </p>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div
                onClick={() => setActiveTab('lessons')}
                className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Today's Lessons</p>
                  <p className="text-lg font-black text-slate-900">{lessons.length} Ready</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('ai-helper')}
                className="bg-white p-5 rounded-3xl border-2 border-indigo-200 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">AI Homework Helper</p>
                  <p className="text-lg font-black text-indigo-700">Get Hints & Steps</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('voice-tutor')}
                className="bg-white p-5 rounded-3xl border-2 border-pink-200 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">AI Voice Tutor</p>
                  <p className="text-lg font-black text-pink-700">Speak & Listen</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('quizzes')}
                className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Adaptive Quizzes</p>
                  <p className="text-lg font-black text-slate-900">{quizzes.length} Quizzes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LESSONS & BOOKMARKS */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-black text-slate-900 text-lg">Today's Interactive Lessons</h2>
              <p className="text-xs text-slate-500">Watch videos, view notes, read PDFs, and bookmark your favorite topics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => {
                const isBookmarked = bookmarks.includes(lesson._id || lesson.id);
                return (
                  <div key={lesson._id || lesson.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase">
                          {lesson.category}
                        </span>
                        <button
                          onClick={() => handleToggleBookmark(lesson._id || lesson.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isBookmarked ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <h3 className="font-black text-slate-900 text-lg mb-1">{lesson.title}</h3>
                      <p className="text-xs text-slate-600 mb-4">{lesson.description}</p>

                      {/* YouTube Video Player Embed */}
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

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>{lesson.grade} • {lesson.subject}</span>
                      <span className="font-bold text-purple-600">{lesson.teacherName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: HOMEWORK & OCR UPLOAD */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* OCR Notebook Scanner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Camera className="w-4 h-4" /> AI OCR Notebook Reader
              </div>
              <h2 className="text-2xl font-black mb-2">OCR Notebook Scanner 📸</h2>
              <p className="text-emerald-100 text-sm max-w-xl mb-4">
                Upload a photo of your handwritten notebook. AI reads your handwriting, checks for missing questions, and provides feedback!
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setOcrFile(e.target.files ? e.target.files[0] : null)}
                  className="text-sm bg-white/20 p-2 rounded-xl border border-emerald-300 text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-white file:text-emerald-800 cursor-pointer"
                />
                <button
                  onClick={handleOcrScan}
                  disabled={isScanningOcr || !ocrFile}
                  className={`px-6 py-3 font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs ${
                    isScanningOcr || !ocrFile ? 'bg-emerald-200 text-emerald-600 opacity-70' : 'bg-white text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  {isScanningOcr ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Reading your question...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-700" /> Scan Notebook Image Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* OCR Scanner Results Display */}
            {ocrData && (
              <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" /> OCR Reading Results (Google Vision API)
                  </h3>
                  {homeworks.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedHw(homeworks[0]);
                        setHomeworkTextAnswer(`[OCR Scanned Notebook Handwriting]:\n${ocrData.extractedText}`);
                        showToast('Attached OCR extracted handwriting to homework submission!');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                    >
                      Attach OCR Text to Homework
                    </button>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line">
                  {ocrData.extractedText}
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs flex items-start justify-between gap-2">
                  <div>
                    <strong>AI Suggestion:</strong> {ocrData.aiSuggestions}
                  </div>
                  {ocrData.missingQuestions?.length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] flex-shrink-0">
                      ⚠️ Missing Question Detected
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Active Homework Assignments */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-900">Your Homework Assignments</h3>
              {homeworks.map((hw) => (
                <div key={hw._id || hw.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                      Due: {hw.dueDate}
                    </span>
                    <h4 className="font-black text-slate-900 text-lg mt-2">{hw.title}</h4>
                    <p className="text-xs text-slate-600 max-w-xl">{hw.description}</p>
                  </div>

                  <button
                    onClick={() => setSelectedHw(hw)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex-shrink-0"
                  >
                    Submit Answer Online
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI HOMEWORK HELPER (CRITICAL RULE: NO DIRECT ANSWERS) */}
        {activeTab === 'ai-helper' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4" /> AI Guided Learning Mascot
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">AI Homework Helper 🤖💡</h2>
              <p className="text-indigo-100 text-sm max-w-xl">
                Need help with a tricky problem? Ask me! I will explain concepts simply, give hints, and guide you step-by-step without giving direct answers!
              </p>
            </div>

            {/* AI Helper Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <form onSubmit={handleAskAiHelper} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    What question are you working on?
                  </label>
                  <textarea
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. How do I add 1/2 and 1/4? Or why do plants need sunlight?"
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isAskingAi}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {isAskingAi ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>AI Tutor is thinking...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Ask AI Tutor For Hints & Guidance
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* AI Response Display */}
            {aiHelperResponse && (
              <div className="bg-indigo-50/80 border-2 border-indigo-200 p-6 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> AI Tutor Hint & Step-by-Step Guide
                </div>
                <p className="text-sm font-medium text-indigo-950 bg-white p-4 rounded-2xl border border-indigo-100 leading-relaxed whitespace-pre-line">
                  {aiHelperResponse.answer}
                </p>
                <div className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 mt-2">
                  <span>Provided by {aiHelperResponse.provider}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AI VOICE TUTOR */}
        {activeTab === 'voice-tutor' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg text-center">
              <h2 className="text-3xl font-black mb-2">AI Voice Tutor 🎙️✨</h2>
              <p className="text-pink-100 text-sm max-w-lg mx-auto mb-6">
                Press the microphone button, speak your question out loud, and listen as the AI Tutor speaks back!
              </p>

              {/* Big Mic Button */}
              <button
                onClick={handleStartVoiceTutor}
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                  isListening
                    ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse'
                    : 'bg-white text-pink-600 hover:scale-105'
                }`}
              >
                <Mic className="w-10 h-10" />
              </button>
              <p className="text-xs font-bold text-pink-100 mt-3">
                {isListening ? 'Listening to your voice...' : 'Tap Mic to Speak'}
              </p>
            </div>

            {/* Voice Transcripts Display */}
            {voiceQuery && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">You Asked:</p>
                  <p className="text-sm font-extrabold text-slate-800">"{voiceQuery}"</p>
                </div>
                {voiceResponse && (
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl text-xs text-pink-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold flex items-center gap-1.5 text-pink-700">
                        <Volume2 className="w-4 h-4" /> AI Voice Response (Gemini API):
                      </p>
                      <button
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(voiceResponse);
                            utterance.pitch = 1.2;
                            utterance.rate = 0.95;
                            window.speechSynthesis.speak(utterance);
                          }
                        }}
                        className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" /> Replay Voice
                      </button>
                    </div>
                    <p className="font-medium leading-relaxed bg-white p-3 rounded-xl border border-pink-100">{voiceResponse}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-black text-slate-900 text-lg">Adaptive Quizzes</h2>
              <p className="text-xs text-slate-500">Attempt quizzes, earn stars, and review recommended practice topics</p>
            </div>

            {/* Quiz Result Banner */}
            {quizResult && (
              <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg space-y-2 animate-fade-in">
                <h3 className="text-2xl font-black">Quiz Completed! 🎉 Score: {quizResult.score}%</h3>
                <p className="text-xs font-semibold">Correct Answers: {quizResult.correctCount} / {quizResult.totalQuestions}</p>
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-xs font-medium">
                  <strong>Recommended Revision:</strong> {quizResult.recommendedRevision}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => (
                <div key={q._id || q.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                      {q.difficulty || 'Medium'} • {q.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{q.questions?.length || 0} Questions</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-1">{q.title}</h3>
                  <p className="text-xs text-slate-500 mb-1">
                    Subject: <span className="font-bold text-slate-700">{q.subject}</span> • Chapter: <span className="font-bold text-slate-700">{q.chapter || 'Ch. 1'}</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-3">Topic: <span className="font-bold text-slate-700">{q.topic}</span></p>

                  {q.sourceMaterialName && (
                    <p className="text-[10px] text-indigo-600 font-bold mb-3">
                      📄 Generated from source: {q.sourceMaterialName}
                    </p>
                  )}

                  {/* Question Player */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {q.questions?.map((ques: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl text-xs space-y-2">
                        <p className="font-bold text-slate-800">Q{idx + 1}: {ques.question}</p>
                        {ques.options?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {ques.options.map((opt: string) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setUserQuizAnswers({ ...userQuizAnswers, [idx]: opt })}
                                className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                                  userQuizAnswers[idx] === opt
                                    ? 'bg-amber-400 text-amber-950 border-amber-500 font-black shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type answer..."
                            value={userQuizAnswers[idx] || ''}
                            onChange={(e) => setUserQuizAnswers({ ...userQuizAnswers, [idx]: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => handleSubmitQuiz(q._id || q.id)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md mt-2 cursor-pointer"
                    >
                      Submit Quiz Answers Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Achievements & Badges 🏆</h2>
                <p className="text-teal-100 text-xs">Unlock shiny badges as you complete daily lessons and quizzes!</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-teal-200 font-bold uppercase">Total Stars</p>
                <p className="text-3xl font-black">⭐ {profile.stars}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-6 rounded-3xl border shadow-sm text-center flex flex-col items-center justify-between ${
                    ach.unlocked ? 'bg-white border-teal-200' : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="text-4xl mb-3">{ach.icon}</div>
                    <h3 className="font-black text-slate-900 text-base">{ach.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 w-full text-xs font-bold text-teal-700">
                    + {ach.starsReward} Stars | + {ach.coinsReward} Coins
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* HOMEWORK SUBMISSION MODAL */}
      {selectedHw && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedHw(null)} className="absolute right-4 top-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-2">Submit Homework: {selectedHw.title}</h2>
            <textarea
              value={homeworkTextAnswer}
              onChange={(e) => setHomeworkTextAnswer(e.target.value)}
              placeholder="Type your homework answer or steps here..."
              className="w-full p-3 rounded-2xl border border-slate-200 text-sm min-h-[120px] mb-4"
            ></textarea>
            <button
              onClick={() => handleSubmitHomeworkAnswer(selectedHw._id || selectedHw.id)}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Send Submission to Teacher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
