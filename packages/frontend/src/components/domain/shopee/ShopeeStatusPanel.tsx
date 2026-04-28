import React from 'react';
import { ShopeeStatus } from '@/types/shopee';
import styles from './ShopeeStatusPanel.module.css';

interface ShopeeStatusPanelProps {
  status: ShopeeStatus | null;
  onConfigureToken: () => void;
  onSyncNow: () => void;
}

export const ShopeeStatusPanel: React.FC<ShopeeStatusPanelProps> = ({ 
  status, 
  onConfigureToken, 
  onSyncNow 
}) => {
  if (!status) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Status da Conexão</span>
          <span className={`${styles.statValue} ${status.isActive ? styles.statusActive : styles.statusInactive}`}>
            Status: {status.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Taxa de Sucesso</span>
          <span className={styles.statValue}>Taxa de Sucesso: {status.successRate}%</span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Fila de Webhooks</span>
          <span className={styles.statValue}>Webhooks em Fila: {status.queuedWebhooks}</span>
        </div>

        {status.lastWebhookTime && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Último Webhook</span>
            <span className={styles.statValue}>
              {new Date(status.lastWebhookTime).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={`${styles.button} ${styles.secondaryButton}`} onClick={onConfigureToken}>
          Configurar Token
        </button>
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={onSyncNow}>
          Sincronizar Agora
        </button>
      </div>
    </div>
  );
};
