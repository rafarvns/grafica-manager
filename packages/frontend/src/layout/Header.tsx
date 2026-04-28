import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { NotificationIcon } from '@/components/ui/NotificationIcon/NotificationIcon';
import { NotificationPanel } from '@/components/ui/NotificationPanel/NotificationPanel';
import styles from './AppLayout.module.css';

export function Header() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.brandTitle}>Gráfica Manager</h1>
      </div>
      <div className={styles.headerCenter}>
        <Breadcrumb />
      </div>
      <div className={styles.headerRight}>
        <NotificationIcon />
        <Button
          variant="secondary"
          onClick={toggleTheme}
          aria-label={`Alternar tema (atual: ${theme})`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
        <NotificationPanel />
      </div>
    </header>
  );
}
