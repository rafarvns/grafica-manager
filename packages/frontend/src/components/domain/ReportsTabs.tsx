import React from 'react';
import { useRouter } from '@/router/HashRouter';
import styles from './ReportsTabs.module.css';

const TABS = [
  { path: '/relatorios/pedidos', label: 'Pedidos' },
  { path: '/relatorios/impressoes', label: 'Impressões' },
] as const;

function isActiveTab(currentPath: string, tabPath: string): boolean {
  if (tabPath === '/relatorios/pedidos') {
    return currentPath === '/relatorios' || currentPath === '/relatorios/pedidos';
  }
  return currentPath === tabPath;
}

export function ReportsTabs() {
  const { currentPath, navigate } = useRouter();

  return (
    <div className={styles.tabsContainer} role="tablist" aria-label="Tipo de relatório">
      {TABS.map((tab) => {
        const active = isActiveTab(currentPath, tab.path);
        return (
          <button
            key={tab.path}
            role="tab"
            aria-selected={active}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
