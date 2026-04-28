import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerForm } from '@/components/domain/CustomerForm';

describe('CustomerForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();
  const mockGetCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const customerData = {
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

  it('renderiza no modo Novo Cliente com campos vazios', () => {
    render(
      <CustomerForm
        customerId={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
    expect(screen.getByTestId('customer-name-input')).toHaveValue('');
    expect(screen.getByTestId('customer-email-input')).toHaveValue('');
  });

  it('renderiza no modo Editar Cliente e carrega dados', async () => {
    mockGetCustomer.mockResolvedValue(customerData);

    render(
      <CustomerForm
        customerId="1"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    expect(screen.getByText(/Carregando/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
      expect(screen.getByTestId('customer-name-input')).toHaveValue('João Silva');
      expect(screen.getByTestId('customer-email-input')).toHaveValue('joao@example.com');
    });
  });

  it('exibe erros de validação quando campos obrigatórios estão vazios ao submeter', async () => {
    render(
      <CustomerForm
        customerId={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    const submitButton = screen.getByTestId('submit-customer-form');
    fireEvent.click(submitButton);

    // Deve mostrar erros inline (ajustar conforme implementação GREEN)
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('exibe erro de email inválido', async () => {
    render(
      <CustomerForm
        customerId={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    const emailInput = screen.getByTestId('customer-email-input');
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    
    const submitButton = screen.getByTestId('submit-customer-form');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('submete os dados corretamente quando o formulário é válido', async () => {
    render(
      <CustomerForm
        customerId={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    fireEvent.change(screen.getByTestId('customer-name-input'), { target: { value: 'Novo Cliente' } });
    fireEvent.change(screen.getByTestId('customer-email-input'), { target: { value: 'novo@example.com' } });
    
    const submitButton = screen.getByTestId('submit-customer-form');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Novo Cliente',
        email: 'novo@example.com'
      }));
    });
  });

  it('possui role="dialog" e aria-modal="true" para acessibilidade', () => {
    render(
      <CustomerForm
        customerId={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        getCustomer={mockGetCustomer}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
