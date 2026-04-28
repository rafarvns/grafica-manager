import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { RouterProvider, useRouter } from '@/router/HashRouter';
import { useOrderDetail } from '@/hooks/useOrderDetail';

vi.mock('@/hooks/useOrderDetail');
vi.mock('@/router/HashRouter', async () => {
  const actual = await vi.importActual('@/router/HashRouter');
  return {
    ...actual as any,
    useRouter: vi.fn(),
  };
});

describe('OrderDetailPage', () => {
  const mockOrder = {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'draft',
    description: 'Test Description',
    customerName: 'João',
    createdAt: '2026-04-28T10:00:00Z',
    statusHistory: [],
    files: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      currentPath: '/pedidos/1',
      navigate: vi.fn(),
    });
  });

  it('deve exibir loading state', () => {
    (useOrderDetail as any).mockReturnValue({
      loading: true,
      order: null,
      error: null,
    });

    render(
      <RouterProvider>
        <OrderDetailPage />
      </RouterProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve exibir os detalhes do pedido quando carregado', async () => {
    (useOrderDetail as any).mockReturnValue({
      loading: false,
      order: mockOrder,
      error: null,
    });

    render(
      <RouterProvider>
        <OrderDetailPage />
      </RouterProvider>
    );

    expect(await screen.findByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('deve alternar entre abas', async () => {
    (useOrderDetail as any).mockReturnValue({
      loading: false,
      order: mockOrder,
      error: null,
    });

    render(
      <RouterProvider>
        <OrderDetailPage />
      </RouterProvider>
    );

    const timelineTab = screen.getByRole('tab', { name: /timeline/i });
    timelineTab.click();

    expect(await screen.findByText(/histórico do pedido/i)).toBeInTheDocument();
  });
});
