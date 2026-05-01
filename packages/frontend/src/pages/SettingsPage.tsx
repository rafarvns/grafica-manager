import React from 'react';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações do Sistema</h1>
        <p>Personalize as configurações gerais da aplicação.</p>
      </header>

      <main className={styles.content}>
        <div className={styles.comingSoon}>
          <h2>Em breve</h2>
          <p>As configurações do sistema estarão disponíveis em uma próxima versão.</p>
        </div>
      </main>
    </div>
  );
}
