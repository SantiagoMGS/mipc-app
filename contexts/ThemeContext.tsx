'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Cargar el tema guardado del localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    console.log('🔍 Tema guardado en localStorage:', savedTheme);
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('🌙 Aplicando tema oscuro inicial');
      }
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      console.log('🖥️ Preferencia del sistema:', systemTheme);
      setTheme(systemTheme);
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    console.log('🎨 toggleTheme called, current theme:', theme);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 Setting new theme:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('🌙 Dark mode activated, classList:', document.documentElement.classList.toString());
    } else {
      document.documentElement.classList.remove('dark');
      console.log('☀️ Light mode activated, classList:', document.documentElement.classList.toString());
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
