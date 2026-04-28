import React from 'react';
import styles from './OrderTabs.module.css';

export type TabType = 'details' | 'printJobs' | 'files' | 'timeline';

interface OrderTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'details', label: 'Detalhes' },
  { id: 'printJobs', label: 'Impressões' },
  { id: 'files', label: 'Arquivos' },
  { id: 'timeline', label: 'Timeline' },
];

export function OrderTabs({ activeTab, onTabChange }: OrderTabsProps) {
  return (
    <div className={styles.tabsContainer} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
