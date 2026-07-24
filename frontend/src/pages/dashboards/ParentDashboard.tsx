import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import {
  Users,
  LogOut,
  MessageSquare,
  TrendingUp,
  CalendarCheck,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  CheckCircle,
  X,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'homework' | 'chat'>('overview');

  // State Data
  const [childProfile, setChildProfile] = useState<any>({ name: 'Leo Vance', grade: 'Grade 4 - Alpha', teacherName: 'Prof. John Keating' });
  const [attendanceStats, setAttendanceStats] = useState<any>({ monthlyPercentage: 98.0, attendanceLog: [] });
  const [performanceCharts, setPerformanceCharts] = useState<any>({ weeklyGrowth: [], subjectComparison: [] });
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [homeworkSummary, setHomeworkSummary] = useState<any[]>([]);

  // Chat & Appointment State
  const [chatData, setChatData] = useState<any>({ isWorkingHours: true, messages: [] });
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [appointmentData, setAppointmentData] = useState<any>({ date: '2026-08-05', timeSlot: '02:00 PM', topic: 'Learning Growth Review' });

  // Notifications & Loading
  const [notification, setNotification] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Data on Mount
  useEffect(() => {
    loadParentDashboardData();
  }, []);

  const loadParentDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, chatRes] = await Promise.all([
        fetchApi<any>('/parent/dashboard').catch(() => null),
        fetchApi<any>('/parent/chat').catch(() => null),
      ]);

      if (dashRes && dashRes.success) {
        setChildProfile(dashRes.childProfile);
        setAttendanceStats(dashRes.attendanceStats);
        setPerformanceCharts(dashRes.performanceCharts);
        setAiRecommendations(dashRes.aiRecommendations || []);
        setUpcomingActivities(dashRes.upcomingActivities || []);
        setHomeworkSummary(dashRes.homeworkSummary || []);
      }

      if (chatRes && chatRes.success) {
        setChatData(chatRes);
      }
    } catch (err) {
      console.error('Error loading parent dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Send Message to Teacher (Working Hours Check)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    try {
      const res = await fetchApi<any>('/parent/chat/send', {
        method: 'POST',
        body: JSON.stringify({ text: newMessageText }),
      });

      if (res.success) {
        showToast(res.notice);
        setChatData((prev: any) => ({
          ...prev,
          messages: [...prev.messages, res.messageSent],
        }));
        setNewMessageText('');
      }
    } catch (err: any) {
      showToast('Error sending message.');
    }
  };

  // Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<any>('/parent/appointment', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });

      if (res.success) {
        showToast(res.message);
        setShowAppointmentModal(false);
      }
    } catch (err: any) {
      showToast('Failed to book appointment.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 flex items-center gap-2">
              EduSpark AI <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Parent Portal</span>
            </h1>
            <p className="text-xs text-slate-500">Child Progress Monitoring & Teacher Connection</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          {/* Working Hours Indicator */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              chatData.isWorkingHours
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{chatData.isWorkingHours ? 'Teacher Available (9 AM – 4 PM)' : 'Teacher Unavailable Outside Hours'}</span>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800">{user?.name}</p>
            <p className="text-xs text-teal-600 font-bold">Guardian of {childProfile.name}</p>
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
            <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            Loading Child Growth Insights...
          </div>
        )}
        {/* Toast Alert */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-teal-600 text-white font-bold text-sm flex items-center justify-between shadow-lg animate-fade-in">
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
              activeTab === 'overview' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Overview & Charts
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'attendance' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Attendance ({attendanceStats.monthlyPercentage}%)
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'homework' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Homework Status
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Teacher Chat & Appointments
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PERFORMANCE CHARTS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> Real-Time Parent Progress Center
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Child Learning Overview: {childProfile.name} 👨‍👩‍👧</h2>
              <p className="text-teal-100 text-sm max-w-2xl">
                Class: {childProfile.grade} | Teacher: {childProfile.teacherName} | School: {childProfile.school}
              </p>
            </div>

            {/* Recharts Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Line Chart: Weekly Learning Growth */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Weekly Learning Growth</h3>
                    <p className="text-xs text-slate-500">Quiz score & homework completion trajectory</p>
                  </div>
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceCharts.weeklyGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[60, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" name="Quiz Score %" stroke="#0d9488" strokeWidth={3} />
                      <Line type="monotone" dataKey="homework" name="Homework %" stroke="#6366f1" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Subject Score vs Class Average */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Subject Comparison</h3>
                    <p className="text-xs text-slate-500">{childProfile.name}'s score vs Class Average (%)</p>
                  </div>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceCharts.subjectComparison || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" name={`${childProfile.name}'s Score`} fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="classAverage" name="Class Average" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI Recommendations for Parents */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-black text-slate-900">AI Recommendations for Parents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiRecommendations.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black text-teal-800 bg-teal-200 px-2 py-0.5 rounded-full uppercase">
                        {rec.category}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5">{rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming School Activities */}
            {upcomingActivities.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-4">Upcoming School Activities 📅</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingActivities.map((act) => (
                    <div key={act.id} className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                        <p className="text-xs text-purple-700 font-semibold">{act.date} • {act.time}</p>
                      </div>
                      <span className="px-3 py-1 bg-purple-200 text-purple-900 text-[10px] font-black rounded-full uppercase">
                        Event
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATTENDANCE TRACKER */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-black text-slate-900 text-xl">Attendance Report</h2>
                <p className="text-xs text-slate-500">Daily check-in timestamps and late arrival logs</p>
              </div>
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Monthly Attendance</p>
                  <p className="text-2xl font-black text-emerald-700">{attendanceStats.monthlyPercentage}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4">Arrival Status</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {attendanceStats.attendanceLog?.map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-4 font-bold text-slate-900">{log.date}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            log.status === 'On Time' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HOMEWORK STATUS */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-black text-slate-900 text-lg">Homework Completion Status</h2>
              <p className="text-xs text-slate-500">Track submitted work, pending tasks, and teacher marks/feedback</p>
            </div>

            <div className="space-y-4">
              {homeworkSummary.map((hw) => (
                <div key={hw._id || hw.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-black">
                      Due: {hw.dueDate}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">{hw.totalMarks} Total Marks</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{hw.title}</h3>
                  <p className="text-xs text-slate-600">{hw.description}</p>

                  {/* Submissions list */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {hw.submissions?.map((sub: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Submitted by {sub.studentName}</span>
                          <span className="font-black text-emerald-600">Marks: {sub.marksObtained}/{hw.totalMarks}</span>
                        </div>
                        <p className="text-slate-600"><strong>Teacher Feedback:</strong> {sub.feedback || 'Pending review'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TEACHER CHAT & APPOINTMENT BOOKING */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            {/* Working Hours Notice Banner */}
            <div
              className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
                chatData.isWorkingHours
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{chatData.workingHoursNotice}</span>
              </div>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Book Appointment
              </button>
            </div>

            {/* Chat Conversation Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Chat with {chatData.teacherName || 'Prof. John Keating'}</h3>
                  <p className="text-[11px] text-slate-500">Working Hours: 9:00 AM – 4:00 PM</p>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatData.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                      msg.isTeacher
                        ? 'bg-slate-100 text-slate-800 self-start mr-auto rounded-tl-none'
                        : 'bg-teal-600 text-white self-end ml-auto rounded-tr-none'
                    }`}
                  >
                    <p className="font-bold text-[10px] opacity-80">{msg.sender}</p>
                    <p className="font-medium">{msg.text}</p>
                    <p className="text-[9px] opacity-70 text-right">{msg.timestamp}</p>
                  </div>
                ))}
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={chatData.isWorkingHours ? 'Type your message...' : 'Teacher is currently unavailable (9 AM - 4 PM)'}
                  className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* APPOINTMENT BOOKING MODAL */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowAppointmentModal(false)} className="absolute right-4 top-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-4">Book Appointment with Teacher</h2>
            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Date</label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Slot (9 AM – 4 PM)</label>
                <select
                  value={appointmentData.timeSlot}
                  onChange={(e) => setAppointmentData({ ...appointmentData, timeSlot: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discussion Topic</label>
                <input
                  type="text"
                  value={appointmentData.topic}
                  onChange={(e) => setAppointmentData({ ...appointmentData, topic: e.target.value })}
                  placeholder="e.g. Mathematics & Reading Growth"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl text-xs shadow-md mt-4">
                Confirm Appointment Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
