import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layoutContainer}>
      <Header />
      <div className={styles.layoutBody}>
        <Sidebar />
        <main className={styles.layoutMain}>
          {children}
        </main>
      </div>
    </div>
  );
}
