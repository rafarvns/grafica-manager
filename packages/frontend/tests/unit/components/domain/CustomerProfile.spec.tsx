import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CustomerProfile } from '@/components/domain/CustomerProfile';

describe('CustomerProfile Component', () => {
  const mockOnClose = vi.fn();
  const mockGetCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const customerDetail = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11987654321',
    address: 'Rua A, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    notes: 'Cliente antigo',
    createdAt: new Date(),
    deletedAt: null,
    orderSummary: {
      total: 5,
      active: 1,
      completed: 4,
      cancelled: 0,
      totalValue: 500,
    }
  };

  it('exibe o spinner de loading inicialmente', () => {
    mockGetCustomer.mockReturnValue(new Promise(() => {})); // Nunca resolve

    render(
      <CustomerProfile
        customerId="1"
        getCustomer={mockGetCustomer}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renderiza os detalhes do cliente quando os dados são carregados', async () => {
    mockGetCustomer.mockResolvedValue(customerDetail);

    render(
      <CustomerProfile
        customerId="1"
        getCustomer={mockGetCustomer}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('joao@example.com')).toBeInTheDocument();
      expect(screen.getByText('11987654321')).toBeInTheDocument();
      expect(screen.getByText(/Rua A, 123/)).toBeInTheDocument();
    });
  });

  it('exibe o resumo de pedidos', async () => {
    mockGetCustomer.mockResolvedValue(customerDetail);

    render(
      <CustomerProfile
        customerId="1"
        getCustomer={mockGetCustomer}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('customer-order-summary')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total
      expect(screen.getByText('R$ 500.00')).toBeInTheDocument();
    });
  });

  it('chama onClose ao clicar no botão fechar ou overlay', async () => {
    mockGetCustomer.mockResolvedValue(customerDetail);

    render(
      <CustomerProfile
        customerId="1"
        getCustomer={mockGetCustomer}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Fechar');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('possui role="dialog" para acessibilidade', async () => {
    mockGetCustomer.mockResolvedValue(customerDetail);

    render(
      <CustomerProfile
        customerId="1"
        getCustomer={mockGetCustomer}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
