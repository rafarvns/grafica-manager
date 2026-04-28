import React from 'react';
import { Order } from '@/hooks/useOrders';
import styles from './OrderTable.module.css';

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onChangeStatus: (orderId: string, status: string) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_production: 'Em Produção',
  completed: 'Concluído',
  shipping: 'Enviando',
  cancelled: 'Cancelado',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_production', label: 'Em Produção' },
  { value: 'completed', label: 'Concluído' },
  { value: 'shipping', label: 'Enviando' },
];

export function OrderTable({
  orders,
  loading,
  selectedOrderId,
  onSelectOrder,
  onChangeStatus,
  onCancelOrder,
}: OrderTableProps) {
  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Status</th>
            <th>Descrição</th>
            <th>Quantidade</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.empty}>
                Nenhum pedido encontrado
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className={selectedOrderId === order.id ? styles.selected : ''}
              >
                <td>{order.orderNumber}</td>
                <td>{STATUS_LABELS[order.status] || order.status}</td>
                <td className={styles.description}>{order.description}</td>
                <td>{order.quantity}</td>
                <td>{order.salePrice.toFixed(2)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onSelectOrder(order.id)}
                      className={styles.detailsButton}
                      title="Ver detalhes"
                    >
                      Detalhes
                    </button>
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <select
                        value={order.status}
                        onChange={(e) => onChangeStatus(order.id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo da cancelamento:');
                          if (reason) {
                            onCancelOrder(order.id, reason);
                          }
                        }}
                        className={styles.cancelButton}
                        title="Cancelar"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
