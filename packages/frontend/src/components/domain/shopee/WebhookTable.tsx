import React from 'react';
import { WebhookEvent } from '@/types/shopee';
import styles from './WebhookTable.module.css';

interface WebhookTableProps {
  webhooks: WebhookEvent[];
  loading: boolean;
  onSelectWebhook: (webhook: WebhookEvent) => void;
  onReprocess: (id: string) => void;
}

export const WebhookTable: React.FC<WebhookTableProps> = ({
  webhooks,
  loading,
  onSelectWebhook,
  onReprocess,
}) => {
  if (loading && webhooks.length === 0) {
    return <div className={styles.loadingOverlay}>Carregando webhooks...</div>;
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'processed': return styles.processed;
      case 'error': return styles.error;
      case 'pending': return styles.pending;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Evento</th>
            <th>ID Pedido Shopee</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((wh) => (
            <tr key={wh.id} className={styles.row} onClick={() => onSelectWebhook(wh)}>
              <td data-label="Timestamp">{new Date(wh.timestamp).toLocaleString()}</td>
              <td data-label="Evento">{wh.eventType}</td>
              <td data-label="ID Pedido Shopee">{wh.shopeeOrderId}</td>
              <td data-label="Status">
                <span className={`${styles.badge} ${getStatusClass(wh.status)}`}>
                  {wh.status}
                </span>
              </td>
              <td data-label="Ações" onClick={(e) => e.stopPropagation()}>
                {wh.status === 'error' && (
                  <button 
                    className={styles.reprocessBtn}
                    onClick={() => onReprocess(wh.id)}
                    aria-label="Reprocessar"
                  >
                    Reprocessar
                  </button>
                )}
              </td>
            </tr>
          ))}
          {webhooks.length === 0 && !loading && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                Nenhum webhook encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
