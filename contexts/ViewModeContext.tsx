'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ViewMode = 'table' | 'cards';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>('table');
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar preferencia desde localStorage al montar
  useEffect(() => {
    const savedMode = localStorage.getItem('viewMode') as ViewMode;
    if (savedMode === 'table' || savedMode === 'cards') {
      setViewModeState(savedMode);
    }
    setIsHydrated(true);
  }, []);

  // Guardar preferencia en localStorage cuando cambie
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', mode);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'table' ? 'cards' : 'table';
    setViewMode(newMode);
  };

  // Evitar flash de contenido incorrecto durante hidratación
  if (!isHydrated) {
    return null;
  }

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
