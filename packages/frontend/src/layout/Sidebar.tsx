import React from 'react';
import { useRouter } from '@/router/HashRouter';
import styles from './AppLayout.module.css';

export function Sidebar() {
  const { currentPath, navigate } = useRouter();

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/pdv', label: 'PDV' },
    { path: '/estoque', label: 'Estoque' },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul className={styles.navList}>
          {links.map((link) => (
            <li key={link.path}>
              <a
                href={`#${link.path}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}
                className={`${styles.navLink} ${currentPath === link.path ? styles.active : ''}`}
                aria-current={currentPath === link.path ? 'page' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
