import React from 'react';
import type { UserRole } from '../types/auth';
import { Sparkles, GraduationCap, Users, Shield } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const rolesConfig: {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Learn and grow',
    icon: Sparkles,
  },
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Teach and inspire',
    icon: GraduationCap,
  },
  {
    id: 'parent',
    title: 'Parent',
    description: 'Track progress',
    icon: Users,
  },
  {
    id: 'admin',
    title: 'School Admin',
    description: 'Manage school',
    icon: Shield,
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="w-full mb-5">
      <div className="grid grid-cols-2 gap-3">
        {rolesConfig.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{role.title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{role.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
