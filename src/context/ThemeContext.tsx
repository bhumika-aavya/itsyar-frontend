import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const getStoredTheme = (): Theme => {
    const userThemeKey = userId ? `theme_${userId}` : null;
    const storedUserTheme = userThemeKey ? localStorage.getItem(userThemeKey) : null;
    if (storedUserTheme === 'light' || storedUserTheme === 'dark') {
      return storedUserTheme;
    }

    const storedGlobalTheme = localStorage.getItem('theme');
    if (storedGlobalTheme === 'light' || storedGlobalTheme === 'dark') {
      return storedGlobalTheme;
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return systemTheme;
  };

  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // Sync theme when user logs in or out
  useEffect(() => {
    setTheme(getStoredTheme());
  }, [userId]);

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    if (userId) {
      localStorage.setItem(`theme_${userId}`, theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme, userId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
