import React, { useState } from 'react';
import styles from './OrdersPage.module.css';
import { useOrders } from '@/hooks/useOrders';
import { useRouter } from '@/router/HashRouter';
import { OrderFilters } from '@/components/domain/OrderFilters';
import { OrderKanban } from '@/components/domain/OrderKanban';
import { OrderList } from '@/components/domain/OrderList';
import { OrderModal } from '@/components/domain/OrderModal';
import { Order } from '@grafica/shared';

export function OrdersPage() {
  const { navigate } = useRouter();
  const {
    orders,
    loading,
    error,
    view,
    setView,
    filters,
    setFilters,
    moveOrder,
    refresh
  } = useOrders();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined);

  const handleCreateOrder = () => {
    setSelectedOrder(undefined);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    navigate(`/pedidos/${order.id}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Gerenciamento de Pedidos</h1>
          <p>Acompanhe e gerencie todos os pedidos da gráfica</p>
        </div>
        <button className={styles.createButton} onClick={handleCreateOrder}>
          <span className={styles.plus}>+</span> Novo Pedido
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleButton} ${view === 'kanban' ? styles.active : ''}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
          <button 
            className={`${styles.toggleButton} ${view === 'list' ? styles.active : ''}`}
            onClick={() => setView('list')}
          >
            Lista
          </button>
        </div>
      </div>

      <OrderFilters filters={filters} onFilterChange={setFilters} />

      {error && <div className={styles.error}>{error}</div>}

      <main className={styles.main}>
        {loading && <div className={styles.loader}>Carregando pedidos...</div>}
        
        {!loading && view === 'kanban' && (
          <OrderKanban orders={orders} onMoveOrder={moveOrder} onEdit={handleEditOrder} />
        )}

        {!loading && view === 'list' && (
          <OrderList orders={orders} onEdit={handleEditOrder} onMoveOrder={moveOrder} />
        )}
      </main>

      <OrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refresh}
        initialOrder={selectedOrder}
      />
    </div>
  );
}
