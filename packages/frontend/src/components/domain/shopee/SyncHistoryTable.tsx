import React from 'react';
import { SyncHistoryEntry } from '@/types/shopee';
import styles from './WebhookTable.module.css'; // Reutilizando estilos de tabela

interface SyncHistoryTableProps {
  history: SyncHistoryEntry[];
  loading: boolean;
}

export const SyncHistoryTable: React.FC<SyncHistoryTableProps> = ({ history, loading }) => {
  if (loading) return <div>Carregando histórico...</div>;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Usuário</th>
            <th>Pedidos (S/F)</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className={styles.row}>
              <td>{new Date(entry.timestamp).toLocaleString()}</td>
              <td>{entry.user}</td>
              <td>
                <span style={{ color: '#4caf50' }}>{entry.processedOrders}</span> / 
                <span style={{ color: '#f44336' }}> {entry.failedOrders}</span>
              </td>
              <td>{entry.duration}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                Nenhuma sincronização manual registrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
