import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isLoading, getRoleDashboardPath } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unauthorizedCountdown, setUnauthorizedCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: any;
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      setUnauthorizedCountdown(3);
      timer = setInterval(() => {
        setUnauthorizedCountdown((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            navigate(getRoleDashboardPath(user.role), { replace: true });
            return 0;
          }
          return prev !== null ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-xs font-bold">Verifying EduSpark AI Authentication...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              You are signed in as a <span className="font-bold text-slate-800 capitalize">{user.role}</span>. You are not authorized to access this page.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
            Redirecting to your dashboard in {unauthorizedCountdown ?? 3}s...
          </div>
          <button
            onClick={() => navigate(getRoleDashboardPath(user.role), { replace: true })}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Go to My Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
