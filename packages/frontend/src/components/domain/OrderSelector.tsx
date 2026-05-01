import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';
import type { Order } from '@grafica/shared';

interface OrderSelectorProps {
  value: string;
  onChange: (orderId: string, order: Order | null) => void;
  disabled?: boolean;
}

const ACTIVE_STATUSES = 'draft,scheduled,in_production';

export function OrderSelector({ value, onChange, disabled }: OrderSelectorProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ data: Order[] }>('/orders', { params: { statuses: ACTIVE_STATUSES, pageSize: 200 } })
      .then((r) => setOrders(r.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const order = orders.find((o) => o.id === id) || null;
    onChange(id, order);
  };

  return (
    <div>
      <label htmlFor="order-selector">Pedido (opcional)</label>
      <select
        id="order-selector"
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
      >
        <option value="">— Nenhum pedido —</option>
        {orders.map((o) => (
          <option key={o.id} value={o.id}>
            {o.orderNumber} — {o.customerName || 'Cliente'} — {o.description.slice(0, 40)}
          </option>
        ))}
      </select>
    </div>
  );
}
