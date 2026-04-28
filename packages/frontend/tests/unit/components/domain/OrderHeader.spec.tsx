import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderHeader } from '@/components/domain/OrderHeader';
import { RouterProvider } from '@/router/HashRouter';

describe('OrderHeader', () => {
  const mockOrder = {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'draft',
    customerName: 'João Silva',
    createdAt: '2026-04-28T10:00:00Z',
  };

  it('deve renderizar o número do pedido e status', () => {
    render(
      <RouterProvider>
        <OrderHeader order={mockOrder as any} />
      </RouterProvider>
    );

    expect(screen.getByText('ORD-001')).toBeDefined();
    expect(screen.getByText('Rascunho')).toBeDefined(); 
    expect(screen.getByText('João Silva')).toBeDefined();
  });

  it('deve renderizar botão de voltar', () => {
    render(
      <RouterProvider>
        <OrderHeader order={mockOrder as any} />
      </RouterProvider>
    );

    expect(screen.getByText(/voltar/i)).toBeDefined();
  });
});
