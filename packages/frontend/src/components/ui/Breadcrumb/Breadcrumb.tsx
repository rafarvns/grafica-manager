import React from 'react';
import { useRouter } from '@/router/HashRouter';
import { useBreadcrumb } from './useBreadcrumb';
import styles from './Breadcrumb.module.css';

export function Breadcrumb() {
  const { currentPath, navigate } = useRouter();
  const items = useBreadcrumb(currentPath);

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, idx) => (
          <li key={item.path} className={styles.item}>
            {idx > 0 && <span className={styles.separator}>/</span>}
            {idx === items.length - 1 ? (
              <span className={styles.current}>{item.label}</span>
            ) : (
              <button
                className={styles.link}
                onClick={() => navigate(item.path)}
                aria-label={`Navegar para ${item.label}`}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
