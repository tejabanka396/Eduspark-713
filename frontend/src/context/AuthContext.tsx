import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthResponse } from '../types/auth';
import { fetchApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<UserRole>;
  register: (userData: any) => Promise<UserRole>;
  logout: () => void;
  getRoleDashboardPath: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('eduspark_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('eduspark_token') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getRoleDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'parent':
        return '/parent';
      case 'student':
        return '/student';
      default:
        return '/login';
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await fetchApi<{ success: boolean; user: User }>('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('eduspark_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Token expired or invalid, logging out.');
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<UserRole> => {
    const res = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('eduspark_token', res.token);
      localStorage.setItem('eduspark_user', JSON.stringify(res.user));
      return res.user.role;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (userData: any): Promise<UserRole> => {
    const res = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('eduspark_token', res.token);
      localStorage.setItem('eduspark_user', JSON.stringify(res.user));
      return res.user.role;
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eduspark_token');
    localStorage.removeItem('eduspark_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        getRoleDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
