import React from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { NotificationIcon } from '@/components/ui/NotificationIcon/NotificationIcon';
import { NotificationPanel } from '@/components/ui/NotificationPanel/NotificationPanel';
import styles from './AppLayout.module.css';

export function Header() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Voltar para página anterior"
          title="Voltar"
        >
          &#8592;
        </button>
        <h1 className={styles.brandTitle}>Gráfica Manager</h1>
      </div>
      <div className={styles.headerCenter}>
        <Breadcrumb />
      </div>
      <div className={styles.headerRight}>
        <NotificationIcon />
        <NotificationPanel />
      </div>
    </header>
  );
}
