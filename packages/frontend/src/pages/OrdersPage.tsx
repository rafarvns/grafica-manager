import React, { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderTable } from '@/components/domain/OrderTable';
import { OrderForm } from '@/components/domain/OrderForm';
import { OrderDetailsPanel } from '@/components/domain/OrderDetailsPanel';
import styles from './OrdersPage.module.css';

export function OrdersPage() {
  const { orders, pagination, loading, error, listOrders, createOrder, changeOrderStatus, cancelOrder } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const handleCreateOrder = async (input: any) => {
    try {
      await createOrder(input);
      setShowForm(false);
      await listOrders();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleChangeStatus = async (orderId: string, status: string) => {
    try {
      await changeOrderStatus(orderId, status);
      await listOrders();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder(orderId, reason);
      await listOrders();
      setSelectedOrderId(null);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pedidos</h1>
        <button onClick={() => setShowForm(true)} className={styles.createButton}>
          Novo Pedido
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <OrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className={styles.content}>
        <div className={styles.tableSection}>
          <OrderTable
            orders={orders}
            loading={loading}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            onChangeStatus={handleChangeStatus}
            onCancelOrder={handleCancelOrder}
          />
        </div>

        {selectedOrderId && (
          <div className={styles.panelSection}>
            <OrderDetailsPanel
              orderId={selectedOrderId}
              onStatusChange={handleChangeStatus}
              onCancel={handleCancelOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
}
