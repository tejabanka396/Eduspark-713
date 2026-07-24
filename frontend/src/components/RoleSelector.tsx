import React from 'react';
import type { UserRole } from '../types/auth';
import { ShieldCheck, GraduationCap, Users, Sparkles } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const rolesConfig: {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  border: string;
  badge: string;
}[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Fun lessons, AI tutor, adaptive quizzes & rewards',
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500 text-amber-900',
    border: 'border-amber-400 bg-amber-50/50',
    badge: 'Primary 1-6',
  },
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Upload content, create homework & AI quizzes',
    icon: GraduationCap,
    color: 'from-indigo-500 to-purple-600 text-purple-900',
    border: 'border-indigo-400 bg-indigo-50/50',
    badge: 'Educator',
  },
  {
    id: 'parent',
    title: 'Parent',
    description: 'Track daily progress & chat with teachers',
    icon: Users,
    color: 'from-emerald-400 to-teal-600 text-teal-900',
    border: 'border-emerald-400 bg-emerald-50/50',
    badge: 'Guardian',
  },
  {
    id: 'admin',
    title: 'School Admin',
    description: 'Manage teachers, students, timetables & reports',
    icon: ShieldCheck,
    color: 'from-pink-500 to-rose-600 text-rose-900',
    border: 'border-pink-400 bg-pink-50/50',
    badge: 'Management',
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
        Select Your User Role
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rolesConfig.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRole(r.id)}
              className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 text-center cursor-pointer ${
                isSelected
                  ? `${r.border} ring-2 ring-indigo-500 scale-[1.02] shadow-md`
                  : 'border-slate-200 bg-white/70 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr ${r.color} text-white mb-2 shadow-sm`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">{r.title}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{r.badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
