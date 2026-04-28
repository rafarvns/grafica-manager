import React, { useState, useEffect } from 'react';
import styles from './OrderKanban.module.css';
import { Order, OrderStatus } from '@grafica/shared';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OrderKanbanProps {
  orders: Order[];
  onMoveOrder: (orderId: string, newStatus: OrderStatus, newPosition?: number) => Promise<void>;
  onEdit: (order: Order) => void;
}

const COLUMNS: { id: OrderStatus; label: string }[] = [
  { id: 'draft', label: 'Rascunho' },
  { id: 'scheduled', label: 'Agendado' },
  { id: 'in_production', label: 'Em Produção' },
  { id: 'completed', label: 'Concluído' },
  { id: 'shipping', label: 'Enviado' },
  { id: 'cancelled', label: 'Cancelado' },
];

export function OrderKanban({ orders, onMoveOrder, onEdit }: OrderKanbanProps) {
  const [items, setItems] = useState<Order[]>(orders);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sincronizar estado local quando os pedidos mudarem via prop (ex: refresh do banco)
  useEffect(() => {
    setItems(orders);
  }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Evita disparar drag em cliques acidentais
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string) => {
    if (COLUMNS.find(c => c.id === id)) return id;
    return items.find(item => item.id === id)?.status;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setItems((prev) => {
      const activeIndex = prev.findIndex((i) => i.id === activeId);
      const overIndex = prev.findIndex((i) => i.id === overId);

      let newIndex;
      if (prev.find(i => i.id === overId)) {
        newIndex = overIndex;
      } else {
        newIndex = prev.length;
      }

      const updatedItems = [...prev];
      updatedItems[activeIndex] = {
        ...updatedItems[activeIndex],
        status: overContainer as OrderStatus,
      } as Order;

      return arrayMove(updatedItems, activeIndex, newIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer) {
      const activeIndex = items.findIndex((i) => i.id === activeId);
      const overIndex = items.findIndex((i) => i.id === overId);

      if (activeIndex !== overIndex || activeContainer !== overContainer) {
        const newItems = arrayMove(items, activeIndex, overIndex);
        setItems(newItems);
        
        // Calcular posição relativa dentro da coluna
        const columnItems = newItems.filter(i => i.status === overContainer);
        const newPosition = columnItems.findIndex(i => i.id === activeId);

        await onMoveOrder(activeId, overContainer as OrderStatus, newPosition);
      }
    }

    setActiveId(null);
  };

  const activeOrder = activeId ? items.find(i => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.label}
            orders={items.filter((o) => o.status === column.id)}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeOrder ? (
          <OrderCard order={activeOrder} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  orders: Order[];
  onEdit: (order: Order) => void;
}

function KanbanColumn({ id, title, orders, onEdit }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3 className={styles.columnTitle}>
        {title} <span>({orders.length})</span>
      </h3>
      <SortableContext
        id={id}
        items={orders.map((o) => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.columnContent}>
          {orders.map((order) => (
            <SortableOrderCard key={order.id} order={order} onEdit={onEdit} />
          ))}
          {orders.length === 0 && <div className={styles.emptyColumn}>Solte aqui</div>}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableOrderCard({ order, onEdit }: { order: Order; onEdit: (order: Order) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: { 
      type: 'Order',
      order,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.cardWrapper}
    >
      <OrderCard order={order} onClick={() => onEdit(order)} />
    </div>
  );
}

function OrderCard({ order, onClick, isOverlay }: { order: Order; onClick?: () => void; isOverlay?: boolean }) {
  return (
    <div 
      className={`${styles.card} ${isOverlay ? styles.overlayCard : ''}`} 
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={styles.orderNumber}>{order.orderNumber}</span>
        <span className={styles.deadline}>
          {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'Sem data'}
        </span>
      </div>
      <p className={styles.customerName}>{order.customerName || order.customerId}</p>
      <p className={styles.description}>{order.description}</p>
      <div className={styles.cardFooter}>
        <span className={styles.price}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.salePrice)}
        </span>
        <span className={styles.origin}>{order.origin}</span>
      </div>
    </div>
  );
}
