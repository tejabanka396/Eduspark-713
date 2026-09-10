import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import {
  ShieldCheck,
  LogOut,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  X,
  CheckCircle,
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

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'students' | 'parents' | 'classes' | 'subjects'>('overview');

  // Stats & Analytics State
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>({ attendanceTrend: [], subjectPerformance: [] });
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);

  // Entity Lists State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Loading & Filter States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<string>('');

  // Modal Dialog States
  const [modalType, setModalType] = useState<'teacher' | 'student' | 'parent' | 'class' | 'subject' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Load Data on Mount
  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, teachersRes, studentsRes, parentsRes, classesRes, subjectsRes] = await Promise.all([
        fetchApi<any>('/admin/stats').catch(() => null),
        fetchApi<any>('/admin/teachers').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/students').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/parents').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/classes').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/subjects').catch(() => ({ data: [] })),
      ]);

      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
        setCharts(statsRes.charts);
        setAiAlerts(statsRes.aiAlerts || []);
      }

      setTeachers(teachersRes.data || []);
      setStudents(studentsRes.data || []);
      setParents(parentsRes.data || []);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Open Add/Edit Modal
  const openModal = (type: 'teacher' | 'student' | 'parent' | 'class' | 'subject', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(
        type === 'teacher'
          ? { name: '', email: '', password: 'password123', subject: 'Mathematics & Science', grade: 'Grade 4', assignedClass: 'Grade 4 - Alpha' }
          : type === 'student'
          ? { name: '', email: '', password: 'password123', grade: 'Grade 4', assignedClass: 'Grade 4 - Alpha', parentName: '' }
          : type === 'parent'
          ? { name: '', email: '', password: 'password123', phone: '+1 555-0199', linkedStudent: '' }
          : type === 'class'
          ? { name: '', grade: 'Grade 4', section: 'A', room: 'Room 101', teacherName: 'Unassigned', capacity: 30 }
          : { name: '', code: '', grade: 'All Grades', description: '', icon: '📚' }
      );
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setFormData({});
  };

  // Handle Form Submit (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = `/admin/${modalType}s${editingItem ? `/${editingItem._id || editingItem.id}` : ''}`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetchApi<any>(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        showToast(res.message || 'Saved successfully!');
        closeModal();
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving item.');
    }
  };

  // Handle Item Delete
  const handleDelete = async (type: 'teacher' | 'student' | 'parent' | 'class' | 'subject', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const res = await fetchApi<any>(`/admin/${type}s/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`Successfully deleted ${type}.`);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 flex items-center gap-2">
              EduSpark AI <span className="bg-pink-100 text-pink-700 text-xs px-2.5 py-0.5 rounded-full font-bold">Admin Portal</span>
            </h1>
            <p className="text-xs text-slate-500">Centralized School Management & Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800">{user?.name}</p>
            <p className="text-xs text-pink-600 font-bold">School Administrator</p>
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
            <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            Syncing Real-Time School Records...
          </div>
        )}
        {/* Toast Notification Alert */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-between shadow-lg animate-fade-in">
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
              activeTab === 'overview'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'parents'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Parents ({parents.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <School className="w-4 h-4" /> Classes ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Subjects ({subjects.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Highlights Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teachers</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.totalTeachers || teachers.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.totalStudents || students.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Parents</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.totalParents || parents.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <School className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Classes</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.totalClasses || classes.length}</p>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Line Chart: Attendance & Homework Trend */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Attendance & Homework Trend</h3>
                    <p className="text-xs text-slate-500">Monthly student participation rate (%)</p>
                  </div>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.attendanceTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[70, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#4f46e5" strokeWidth={3} />
                      <Line type="monotone" dataKey="homework" name="Homework %" stroke="#ec4899" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Subject Performance */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Subject Performance Averages</h3>
                    <p className="text-xs text-slate-500">Average quiz score across subjects (%)</p>
                  </div>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.subjectPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="averageScore" name="Average Score %" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI Insights & Alerts Panel */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-black">AI School Intelligence & Risk Alerts</h3>
              </div>
              <div className="space-y-3">
                {aiAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-200">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEACHERS MANAGEMENT */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search teachers by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => openModal('teacher')}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Teacher
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <th className="p-4">Teacher Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Primary Subject</th>
                      <th className="p-4">Grade Level</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {teachers
                      .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((t) => (
                        <tr key={t._id || t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                              {t.name.charAt(0)}
                            </div>
                            {t.name}
                          </td>
                          <td className="p-4 text-slate-600">{t.email}</td>
                          <td className="p-4 font-semibold text-indigo-600">{t.subject || 'General'}</td>
                          <td className="p-4 font-medium text-slate-700">{t.grade || 'Grade 4'}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openModal('teacher', t)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('teacher', t._id || t.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => openModal('student')}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Student
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Grade</th>
                      <th className="p-4">Assigned Class</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students
                      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s) => (
                        <tr key={s._id || s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                              🎒
                            </div>
                            {s.name}
                          </td>
                          <td className="p-4 text-slate-600">{s.email}</td>
                          <td className="p-4 font-semibold text-amber-700">{s.grade || 'Grade 4'}</td>
                          <td className="p-4 font-medium text-slate-700">{s.assignedClass || 'Grade 4 - Alpha'}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openModal('student', s)}
                              className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('student', s._id || s.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARENTS MANAGEMENT */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search parents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => openModal('parent')}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Parent
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <th className="p-4">Parent Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Linked Student</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {parents
                      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((p) => (
                        <tr key={p._id || p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">
                              👨‍👩‍👧
                            </div>
                            {p.name}
                          </td>
                          <td className="p-4 text-slate-600">{p.email}</td>
                          <td className="p-4 font-semibold text-slate-700">{p.phone || '+1 555-0192'}</td>
                          <td className="p-4 font-medium text-emerald-700">{p.linkedStudent || 'Leo Vance'}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openModal('parent', p)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('parent', p._id || p.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLASSES MANAGEMENT */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => openModal('class')}
                className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Create New Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((c) => (
                  <div key={c._id || c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black">
                          {c.grade}
                        </span>
                        <div className="space-x-1">
                          <button
                            onClick={() => openModal('class', c)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('class', c._id || c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{c.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Room: {c.room || 'Room 101'}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                        <p className="text-slate-600">
                          <strong className="text-slate-800">Teacher:</strong> {c.teacherName || 'Prof. John Keating'}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800">Enrolled Students:</strong> {c.studentsCount || 24} / {c.capacity || 30}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 6: SUBJECTS MANAGEMENT */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => openModal('subject')}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Subject
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects
                .filter((s) => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.code?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((s) => (
                  <div key={s._id || s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{s.icon || '📚'}</span>
                        <div className="space-x-1">
                          <button
                            onClick={() => openModal('subject', s)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('subject', s._id || s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg">{s.name}</h3>
                        {s.code && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{s.code}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{s.description || 'Core Curriculum Subject'}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                        <p className="text-slate-600">
                          <strong className="text-slate-800">Grade Scope:</strong> {s.grade || 'All Grades'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DIALOG FOR ADD / EDIT */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={closeModal} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 mb-4 capitalize">
              {editingItem ? 'Edit' : 'Add New'} {modalType}
            </h2>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {modalType !== 'class' && modalType !== 'subject' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              {!editingItem && modalType !== 'class' && modalType !== 'subject' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Password</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    required
                  />
                </div>
              )}

              {modalType === 'teacher' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Subject</label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              )}

              {modalType === 'subject' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. MATH-101"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Icon / Emoji</label>
                    <input
                      type="text"
                      value={formData.icon || '📚'}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {(modalType === 'student' || modalType === 'teacher' || modalType === 'class' || modalType === 'subject') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grade Level</label>
                  <select
                    value={formData.grade || 'Grade 4'}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="All Grades">All Grades</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>
              )}

              {modalType === 'parent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-xl text-xs hover:bg-pink-700 shadow-md"
                >
                  Save {modalType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
