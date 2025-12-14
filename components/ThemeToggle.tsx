'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check initial preference
    const isDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
      title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}