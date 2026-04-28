import React from 'react';
import styles from './OrderList.module.css';
import { Order, OrderStatus } from '@grafica/shared';

interface OrderListProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onMoveOrder: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

const statusLabels: Record<OrderStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_production: 'Em Produção',
  completed: 'Concluído',
  shipping: 'Enviado',
  cancelled: 'Cancelado',
};

export function OrderList({ orders, onEdit, onMoveOrder }: OrderListProps) {
  if (orders.length === 0) {
    return <div className={styles.empty}>Nenhum pedido encontrado.</div>;
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await onMoveOrder(orderId, newStatus as OrderStatus);
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Descrição</th>
            <th>Status</th>
            <th>Data Limite</th>
            <th>Preço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className={styles.row}>
              <td className={styles.orderNumber}>{order.orderNumber}</td>
              <td>{order.customerName || order.customerId}</td>
              <td className={styles.description}>{order.description}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`${styles.statusSelect} ${styles[order.status]}`}
                  disabled={order.status === 'shipping' || order.status === 'cancelled'}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '-'}</td>
              <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.salePrice)}</td>
              <td>
                <button 
                  onClick={() => onEdit(order)} 
                  className={styles.editButton}
                  disabled={order.status === 'shipping'}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
