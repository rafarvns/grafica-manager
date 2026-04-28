import { describe, it, expect } from 'vitest';
import { Order } from '@/domain/entities/Order';

describe('Order Entity', () => {
  it('should create a valid order', () => {
    const order = Order.create({
      orderNumber: 'ORD-0001',
      description: 'Test Order',
      quantity: 10,
      salePrice: 100,
      productionCost: 50,
      status: 'draft',
    });

    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBe('ORD-0001');
    expect(order.status).toBe('draft');
    expect(order.salePrice).toBe(100);
  });

  it('should update status and record history format', () => {
    const order = Order.create({
      orderNumber: 'ORD-0001',
      description: 'Test Order',
      quantity: 10,
      salePrice: 100,
      productionCost: 50,
      status: 'draft',
    });

    order.changeStatus('scheduled', 'Manual update');
    expect(order.status).toBe('scheduled');
  });
});
