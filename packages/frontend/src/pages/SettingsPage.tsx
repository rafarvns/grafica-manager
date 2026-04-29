import React, { useState } from 'react';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import { usePriceTable } from '@/hooks/usePriceTable';
import styles from './SettingsPage.module.css';

type SettingsTab = 'paper' | 'prices' | 'presets';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('paper');
  const { prices, createPrice, updatePrice, deletePrice, fetchPrices } = usePriceTable();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações do Sistema</h1>
        <p>Gerencie papéis, preços e presets de impressão.</p>
      </header>

      <nav className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'paper' ? styles.active : ''}`}
          onClick={() => setActiveTab('paper')}
        >
          Tipos de Papel
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'prices' ? styles.active : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          Tabela de Preços
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'presets' ? styles.active : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          Presets de Impressão
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'paper' && (
          <section>
            <h2>Gerenciamento de Papéis</h2>
            <p>Em breve: Lista e formulário de papéis.</p>
          </section>
        )}
        {activeTab === 'prices' && (
          <section>
            <PriceTableManager
              priceTable={prices}
              onPricesUpdated={fetchPrices}
              onCreate={createPrice}
              onUpdate={updatePrice}
              onDelete={deletePrice}
            />
          </section>
        )}
        {activeTab === 'presets' && (
          <section>
            <h2>Presets de Impressão</h2>
            <p>Em breve: Configuração de presets rápidos.</p>
          </section>
        )}
      </main>
    </div>
  );
}
