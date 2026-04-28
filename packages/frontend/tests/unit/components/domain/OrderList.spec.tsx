import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderList } from '@/components/domain/OrderList';
import { Order } from '@grafica/shared';

describe('OrderList', () => {
  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerId: 'c1',
      customerName: 'Cliente 1',
      description: 'Desc 1',
      quantity: 10,
      paperType: 'A4',
      dimensions: '21x29',
      deadline: '2026-05-01',
      salePrice: 100,
      productionCost: 50,
      status: 'draft',
      origin: 'MANUAL',
      attachments: [],
      createdAt: '2026-04-28',
      updatedAt: '2026-04-28',
    }
  ];

  it('renderiza lista de pedidos', () => {
    render(<OrderList orders={mockOrders} onEdit={vi.fn()} />);
    
    expect(screen.getByText('ORD-001')).toBeDefined();
    expect(screen.getByText('Desc 1')).toBeDefined();
    expect(screen.getByText('Rascunho')).toBeDefined();
  });

  it('exibe mensagem quando não há pedidos', () => {
    render(<OrderList orders={[]} onEdit={vi.fn()} />);
    expect(screen.getByText(/Nenhum pedido encontrado/i)).toBeDefined();
  });
});
