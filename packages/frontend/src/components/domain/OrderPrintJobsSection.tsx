import React from 'react';
import styles from './OrderPrintJobsSection.module.css';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import type { Order } from '@grafica/shared';

interface OrderPrintJobsSectionProps {
  order: Order;
  onCreatePrintJob: () => Promise<void>;
}

export function OrderPrintJobsSection({ order, onCreatePrintJob }: OrderPrintJobsSectionProps) {
  const statusMap: Record<string, { label: string, variant: any }> = {
    pending: { label: 'Pendente', variant: 'info' },
    processing: { label: 'Processando', variant: 'warning' },
    completed: { label: 'Concluído', variant: 'success' },
    failed: { label: 'Falhou', variant: 'danger' },
  };

  return (
    <div className={styles.container}>
      <Card 
        title="Trabalhos de Impressão"
        footer={
          <Button onClick={onCreatePrintJob} variant="primary">
            + Nova Impressão
          </Button>
        }
      >
        {order.printJobs && order.printJobs.length > 0 ? (
          <div className={styles.list}>
            {order.printJobs.map((job) => {
              const statusInfo = statusMap[job.status] || { label: job.status, variant: 'default' };
              return (
                <div key={job.id} className={styles.item}>
                  <div className={styles.info}>
                    <span className={styles.printerName}>{job.printerName}</span>
                    <span className={styles.date}>
                      {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>Nenhum trabalho de impressão registrado.</p>
        )}
      </Card>
    </div>
  );
}
