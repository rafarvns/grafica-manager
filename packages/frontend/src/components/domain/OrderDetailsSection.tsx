import React, { useState } from 'react';
import styles from './OrderDetailsSection.module.css';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import type { Order } from '@grafica/shared';

interface OrderDetailsSectionProps {
  order: Order;
  onUpdateDescription: (description: string) => Promise<void>;
}

export function OrderDetailsSection({ order, onUpdateDescription }: OrderDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(order.description);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdateDescription(description);
      setIsEditing(false);
    } catch (err) {
      // Erro tratado pelo pai/hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="Informações Básicas">
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Descrição</span>
            {isEditing ? (
              <div className={styles.editRow}>
                <Input 
                  id="order-description"
                  label="Descrição"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  autoFocus
                />
                <Button onClick={handleSave} isLoading={loading}>Salvar</Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            ) : (
              <div className={styles.displayRow}>
                <span className={styles.value}>{order.description}</span>
                {order.status !== 'shipping' && order.status !== 'cancelled' && (
                  <button className={styles.editButton} onClick={() => setIsEditing(true)}>✎</button>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.field}>
            <span className={styles.label}>Quantidade</span>
            <span className={styles.value}>{order.quantity} un</span>
          </div>
          
        </div>
      </Card>

      <Card title="Financeiro e Prazos">
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Preço de Venda</span>
            <span className={`${styles.value} ${styles.price}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.salePrice)}
            </span>
          </div>
          
          <div className={styles.field}>
            <span className={styles.label}>Data Limite</span>
            <span className={styles.value}>
              {new Date(order.deadline).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className={styles.field}>
            <span className={styles.label}>Data de Criação</span>
            <span className={styles.value}>
              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
