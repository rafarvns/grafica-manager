import React from 'react';
import { Link } from '@/router/HashRouter';
import { Badge } from '@/components/ui/Badge/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { Button } from '@/components/ui/Button/Button';
import styles from './OrderHeader.module.css';
import type { Order, OrderStatus } from '@grafica/shared';

interface OrderHeaderProps {
  order: Order;
  onChangeStatus: () => void;
  onCancel: () => void;
}

const statusMap: Record<OrderStatus, { label: string; variant: any }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  scheduled: { label: 'Agendado', variant: 'info' },
  in_production: { label: 'Em Produção', variant: 'warning' },
  completed: { label: 'Concluído', variant: 'success' },
  shipping: { label: 'Enviado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
};

export function OrderHeader({ order, onChangeStatus, onCancel }: OrderHeaderProps) {
  const statusInfo = statusMap[order.status] || { label: order.status, variant: 'default' };

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <Breadcrumb />
        <div className={styles.headerActions}>
          {order.status !== 'cancelled' && order.status !== 'shipping' && (
            <>
              <Button variant="secondary" onClick={onChangeStatus}>Alterar Status</Button>
              <Button variant="danger" onClick={onCancel}>Cancelar Pedido</Button>
            </>
          )}
        </div>
      </div>
      
      <div className={styles.titleRow}>
        <div className={styles.titleInfo}>
          <h1 className={styles.orderNumber}>{order.orderNumber}</h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        
        <div className={styles.customerInfo}>
          <span className={styles.label}>Cliente:</span>
          {order.customerId ? (
            <Link to={`/clientes/${order.customerId}`} className={styles.customerLink}>
              {order.customerName || 'Cliente sem nome'}
            </Link>
          ) : (
            <span className={styles.customerName}>{order.customerName || 'Manual'}</span>
          )}
        </div>
      </div>
      
      <div className={styles.actions}>
        <Link to="/pedidos" className={styles.backButton}>
          ← Voltar para listagem
        </Link>
      </div>
    </header>
  );
}
