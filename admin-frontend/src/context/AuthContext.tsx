import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  permissions?: string[];
  canAccessAdmin?: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User, sessionId?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setToken(stored);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = (accessToken: string, refreshToken: string, newUser: User, sessionId?: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (sessionId) localStorage.setItem('sessionId', sessionId);
    setToken(accessToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
