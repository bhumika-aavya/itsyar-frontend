import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordActiveDay } from '@/lib/streakStore';

const AuthContext = createContext<any>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // Hook for redirection

  useEffect(() => {
    // Check if user is already logged in on page load
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      const parsed = JSON.parse(storedUser);
      const normalized = { ...parsed, role: (parsed.role ?? '').toLowerCase() };
      setUser(normalized);
      recordActiveDay(normalized.id);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    const normalized = { ...userData, role: (userData.role ?? '').toLowerCase() };
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    recordActiveDay(normalized.id);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
     navigate("/login", { replace: true });
  };

  const updateUser = (patch: Partial<{ fullName: string; email: string; avatarUrl: string; role: string }>) => {
    setUser((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};