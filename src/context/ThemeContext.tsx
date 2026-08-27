'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'WIN_CLASSIC' | 'PURE_WHITE' | 'INDUSTRIAL_LIGHT' | 'CYBER_DARK';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('WIN_CLASSIC');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nias_portal_theme') as AppTheme;
      if (savedTheme && ['WIN_CLASSIC', 'PURE_WHITE', 'INDUSTRIAL_LIGHT', 'CYBER_DARK'].includes(savedTheme)) {
        setThemeState(savedTheme);
      } else {
        setThemeState('WIN_CLASSIC');
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
        className={`w-screen h-screen overflow-hidden flex flex-col ${
          theme === 'WIN_CLASSIC'
            ? 'bg-[#d4d0c8] text-black font-sans'
            : theme === 'PURE_WHITE'
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
      theme: 'WIN_CLASSIC' as AppTheme,
      setTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
