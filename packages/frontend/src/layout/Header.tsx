import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button/Button';
import styles from './AppLayout.module.css';

export function Header() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.brandTitle}>Gráfica Manager</h1>
      </div>
      <div className={styles.headerRight}>
        <Button 
          variant="secondary" 
          onClick={toggleTheme}
          aria-label={`Alternar tema (atual: ${theme})`}
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Button>
      </div>
    </header>
  );
}
