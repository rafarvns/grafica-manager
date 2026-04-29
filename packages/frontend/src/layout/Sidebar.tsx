import React from 'react';
import { useRouter } from '@/router/HashRouter';
import styles from './AppLayout.module.css';

const NAV_LINKS = [
  { path: '/', label: 'Dashboard' },
  { path: '/pedidos', label: 'Pedidos' },
  { path: '/clientes', label: 'Clientes' },
  { path: '/impressoes', label: 'Impressões' },
  { path: '/papeis', label: 'Papéis' },
  { path: '/produtos', label: 'Produtos' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/shopee', label: 'Shopee' },
  { path: '/configuracoes', label: 'Configurações' },
];

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
