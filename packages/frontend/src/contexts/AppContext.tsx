import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast/Toast';

export type Theme = 'light' | 'dark';

export interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  // Apenas delegamos os métodos do hook useToast para uso global
  addToast: ReturnType<typeof useToast>['addToast'];
  removeToast: ReturnType<typeof useToast>['removeToast'];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const { toasts, addToast, removeToast } = useToast();

  // Inicializa tema buscando do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('grafica-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('grafica-theme', next);
      
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return ctx;
}
