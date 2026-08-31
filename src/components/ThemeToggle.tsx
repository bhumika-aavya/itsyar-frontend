import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1f2028] text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-[#2e303a] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-amber-500 animate-in spin-in-180 duration-500" />
      ) : (
        <Moon size={18} className="text-slate-400 animate-in spin-in-180 duration-500" />
      )}
    </button>
  );
}
