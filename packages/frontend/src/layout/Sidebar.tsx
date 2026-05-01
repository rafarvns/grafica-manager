import React from 'react';
import { useRouter } from '@/router/HashRouter';
import styles from './AppLayout.module.css';

const NAV_LINKS = [
  { path: '/', label: 'Dashboard' },
  { path: '/pedidos', label: 'Pedidos' },
  { path: '/clientes', label: 'Clientes' },
  { path: '/impressoes', label: 'Impressões' },
  { path: '/cadastros', label: 'Cadastros' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/shopee', label: 'Shopee' },
  { path: '/configuracoes', label: 'Configurações' },
];

function isActive(currentPath: string, linkPath: string): boolean {
  if (linkPath === '/') return currentPath === '/';
  return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
}

export function Sidebar() {
  const { currentPath, navigate } = useRouter();

  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Navegação principal">
        <ul className={styles.navList}>
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <a
                href={`#${link.path}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}
                className={`${styles.navLink} ${isActive(currentPath, link.path) ? styles.active : ''}`}
                aria-current={isActive(currentPath, link.path) ? 'page' : undefined}
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
