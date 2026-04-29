import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrdersPage as Orders } from '@/pages/OrdersPage';
import { useOrders } from '@/hooks/useOrders';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RouterProvider } from '@/router/HashRouter';

vi.mock('@/hooks/useOrders', () => ({
  useOrders: vi.fn(),
}));

describe('Orders Page', () => {
  const mockUseOrders = {
    orders: [],
    loading: false,
    error: null,
    view: 'kanban',
    setView: vi.fn(),
    filters: {},
    setFilters: vi.fn(),
    moveOrder: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useOrders as any).mockReturnValue(mockUseOrders);
  });

  const renderPage = () => {
    return render(
      <NotificationProvider>
        <RouterProvider>
          <Orders />
        </RouterProvider>
      </NotificationProvider>
    );
  };

  it('renderiza o título e o botão de novo pedido', () => {
    renderPage();
    expect(screen.getByText('Gerenciamento de Pedidos')).toBeDefined();
    expect(screen.getByText('Novo Pedido')).toBeDefined();
  });

  it('alterna visualização quando o botão é clicado', () => {
    renderPage();
    const listButton = screen.getByText('Lista');
    fireEvent.click(listButton);
    expect(mockUseOrders.setView).toHaveBeenCalledWith('list');
  });

  it('abre o modal de novo pedido', () => {
    renderPage();
    const newOrderButton = screen.getByText('Novo Pedido');
    fireEvent.click(newOrderButton);
    expect(screen.getByText(/Selecione um cliente/i)).toBeDefined();
  });
});
