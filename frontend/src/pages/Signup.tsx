import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { RoleSelector } from '../components/RoleSelector';
import { User as UserIcon, Mail, Lock, Sparkles, ArrowRight, AlertCircle, BookOpen, School, Phone } from 'lucide-react';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [grade, setGrade] = useState('Grade 4');
  const [subject, setSubject] = useState('Mathematics & Science');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userRole = await register({
        name,
        email,
        password,
        role,
        grade: role === 'student' ? grade : undefined,
        subject: role === 'teacher' ? subject : undefined,
        phone: role === 'parent' || role === 'admin' ? phone : undefined,
      });

      navigate(getRoleDashboardPath(userRole));
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="absolute top-10 right-10 w-36 h-36 bg-purple-300 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-44 h-44 bg-indigo-300 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm mb-3">
            <Sparkles className="w-4 h-4" /> Create EduSpark AI Account
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Join EduSpark AI ✨
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empowering primary school learning with AI personalized tutoring
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <RoleSelector selectedRole={role} onSelectRole={setRole} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white"
                required
              />
            </div>
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Primary Grade
              </label>
              <div className="relative">
                <School className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white appearance-none"
                >
                  <option value="Grade 1">Grade 1 (Age 6-7)</option>
                  <option value="Grade 2">Grade 2 (Age 7-8)</option>
                  <option value="Grade 3">Grade 3 (Age 8-9)</option>
                  <option value="Grade 4">Grade 4 (Age 9-10)</option>
                  <option value="Grade 5">Grade 5 (Age 10-11)</option>
                  <option value="Grade 6">Grade 6 (Age 11-12)</option>
                </select>
              </div>
            </div>
          )}

          {role === 'teacher' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Teaching Subject
              </label>
              <div className="relative">
                <BookOpen className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white appearance-none"
                >
                  <option value="Mathematics & Science">Mathematics & Science</option>
                  <option value="English & Language Arts">English & Language Arts</option>
                  <option value="Social Studies & History">Social Studies & History</option>
                  <option value="General Primary Education">General Primary Education</option>
                  <option value="Art & Technology">Art & Technology</option>
                </select>
              </div>
            </div>
          )}

          {(role === 'parent' || role === 'admin') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0192"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 text-sm focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Account ({role.toUpperCase()})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
};
