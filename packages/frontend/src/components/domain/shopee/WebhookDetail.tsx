import React from 'react';
import { WebhookEvent } from '@/types/shopee';
import styles from './WebhookDetail.module.css';

interface WebhookDetailProps {
  webhook: WebhookEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onReprocess: (id: string) => void;
}

export const WebhookDetail: React.FC<WebhookDetailProps> = ({
  webhook,
  isOpen,
  onClose,
  onReprocess,
}) => {
  if (!isOpen || !webhook) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Detalhes do Webhook</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.section}>
          <h4>Informações Gerais</h4>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>ID do Webhook</label>
              <span>{webhook.id}</span>
            </div>
            <div className={styles.field}>
              <label>Timestamp</label>
              <span>{new Date(webhook.timestamp).toLocaleString()}</span>
            </div>
            <div className={styles.field}>
              <label>Evento</label>
              <span>{webhook.eventType}</span>
            </div>
            <div className={styles.field}>
              <label>ID Pedido Shopee</label>
              <span>{webhook.shopeeOrderId}</span>
            </div>
          </div>
        </div>

        {webhook.errorDetails && (
          <div className={styles.section}>
            <h4>Detalhes do Erro</h4>
            <div className={styles.errorBox}>
              <span className={styles.errorType}>{webhook.errorDetails.type}</span>
              <p className={styles.errorMessage}>{webhook.errorDetails.message}</p>
              <div className={styles.field}>
                <label>Tentativas</label>
                <span>{webhook.errorDetails.attempts} / 3</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h4>Payload JSON</h4>
          <pre className={styles.jsonBox}>
            {JSON.stringify(webhook.payload, null, 2)}
          </pre>
        </div>

        {webhook.status === 'error' && (
          <button className={styles.reprocessBtn} onClick={() => onReprocess(webhook.id)}>
            Reprocessar Agora
          </button>
        )}
      </div>
    </div>
  );
};
