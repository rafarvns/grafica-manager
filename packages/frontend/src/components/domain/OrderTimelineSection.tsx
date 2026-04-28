import React from 'react';
import styles from './OrderTimelineSection.module.css';
import { Card } from '@/components/ui/Card/Card';
import type { Order } from '@grafica/shared';

interface OrderTimelineSectionProps {
  order: Order;
}

export function OrderTimelineSection({ order }: OrderTimelineSectionProps) {
  // Nota: statusHistory deve vir ordenado do backend, mas garantimos aqui
  const history = [...(order.statusHistory || [])].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={styles.container}>
      <Card title="Histórico do Pedido">
        {history.length === 0 ? (
          <p className={styles.empty}>Nenhum histórico registrado.</p>
        ) : (
          <div className={styles.timeline}>
            {history.map((entry, index) => (
              <div key={entry.id || index} className={styles.item}>
                <div className={styles.dot} />
                <div className={styles.content}>
                  <div className={styles.header}>
                    <span className={styles.action}>
                      {entry.fromStatus 
                        ? `Mudado de ${entry.fromStatus} para ${entry.toStatus}` 
                        : `Pedido Criado (status inicial: ${entry.toStatus})`}
                    </span>
                    <time className={styles.date}>
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </time>
                  </div>
                  {entry.reason && <p className={styles.reason}>Motivo: {entry.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
