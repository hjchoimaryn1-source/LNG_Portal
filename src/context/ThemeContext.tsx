'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'PURE_WHITE' | 'INDUSTRIAL_LIGHT' | 'CYBER_DARK';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('PURE_WHITE');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nias_portal_theme') as AppTheme;
      if (savedTheme && ['PURE_WHITE', 'INDUSTRIAL_LIGHT', 'CYBER_DARK'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (e) {
      console.warn('Unable to read saved theme from localStorage:', e);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('nias_portal_theme', newTheme);
    } catch (e) {
      console.warn('Unable to save theme to localStorage:', e);
    }
  };

  const isDark = theme === 'CYBER_DARK';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      <div
        data-theme={theme}
        className={`w-full min-h-screen transition-colors duration-200 ${
          theme === 'PURE_WHITE'
            ? 'bg-white text-slate-900 font-sans'
            : theme === 'INDUSTRIAL_LIGHT'
            ? 'bg-slate-100 text-slate-800 font-sans'
            : 'bg-slate-950 text-slate-100 font-sans'
        }`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'PURE_WHITE' as AppTheme,
      setTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
