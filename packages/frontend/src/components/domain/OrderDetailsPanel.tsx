import React, { useEffect, useState } from 'react';
import { useOrders, OrderCostSummary } from '@/hooks/useOrders';
import styles from './OrderDetailsPanel.module.css';

interface OrderDetailsPanelProps {
  orderId: string;
  onStatusChange: (orderId: string, status: string) => void;
  onCancel: (orderId: string, reason: string) => void;
}

export function OrderDetailsPanel({ orderId, onStatusChange, onCancel }: OrderDetailsPanelProps) {
  const { getOrderCostSummary } = useOrders();
  const [summary, setSummary] = useState<OrderCostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrderCostSummary(orderId);
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [orderId, getOrderCostSummary]);

  if (loading) {
    return <div className={styles.loading}>Carregando detalhes...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!summary) {
    return <div className={styles.empty}>Sem detalhes disponíveis</div>;
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendado',
    in_production: 'Em Produção',
    completed: 'Concluído',
    shipping: 'Enviando',
    cancelled: 'Cancelado',
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Detalhes do Pedido</h3>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Informações</h4>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Número:</span>
            <span className={styles.value}>{summary.orderNumber}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value}>{STATUS_LABELS[summary.status] || summary.status}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Cliente ID:</span>
            <span className={styles.value}>{summary.customerId}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Custos</h4>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Valor de Venda:</span>
            <span className={styles.value}>R$ {summary.salePrice.toFixed(2)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Custo Total:</span>
            <span className={styles.value}>R$ {summary.totalPrintCost.toFixed(2)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Margem:</span>
            <span className={styles.value} style={{ color: summary.margin >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
              R$ {summary.margin.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Impressões</h4>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Total:</span>
            <span className={styles.value}>{summary.printJobCount}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Bem-sucedidas:</span>
            <span className={styles.value} style={{ color: 'var(--color-success)' }}>
              {summary.successfulPrintCount}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Falhadas:</span>
            <span className={styles.value} style={{ color: summary.failedPrintCount > 0 ? 'var(--color-error)' : 'var(--color-text)' }}>
              {summary.failedPrintCount}
            </span>
          </div>
        </div>
      </div>

      {summary.status !== 'cancelled' && summary.status !== 'completed' && (
        <div className={styles.actions}>
          <button
            onClick={() => {
              const reason = prompt('Motivo do cancelamento:');
              if (reason) {
                onCancel(orderId, reason);
              }
            }}
            className={styles.cancelButton}
          >
            Cancelar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
