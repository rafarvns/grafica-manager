import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersPage } from '@/pages/CustomersPage';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';

// Mocking hooks
vi.mock('@/hooks/useCustomers');
vi.mock('@/hooks/useToast');

describe('CustomersPage Integration', () => {
  const mockListCustomers = vi.fn();
  const mockCreateCustomer = vi.fn();
  const mockUpdateCustomer = vi.fn();
  const mockDeleteCustomer = vi.fn();
  const mockGetCustomer = vi.fn();
  const mockAddToast = vi.fn();

  const mockCustomers = [
    { id: '1', name: 'João Silva', email: 'joao@example.com', createdAt: new Date(), deletedAt: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useCustomers as any).mockReturnValue({
      customers: mockCustomers,
      pagination: { page: 1, pageSize: 25, total: 1 },
      loading: false,
      error: null,
      listCustomers: mockListCustomers,
      createCustomer: mockCreateCustomer,
      updateCustomer: mockUpdateCustomer,
      deleteCustomer: mockDeleteCustomer,
      getCustomer: mockGetCustomer,
    });
    (useToast as any).mockReturnValue({
      addToast: mockAddToast,
    });
  });

  it('renderiza os componentes principais da página', () => {
    render(<CustomersPage />);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByTestId('create-customer-button')).toBeInTheDocument();
    expect(screen.getByTestId('filter-customer-name')).toBeInTheDocument();
    expect(screen.getByTestId('customers-table')).toBeInTheDocument();
  });

  it('abre o modal de novo cliente ao clicar no botão', () => {
    render(<CustomersPage />);

    fireEvent.click(screen.getByTestId('create-customer-button'));
    expect(screen.getByTestId('customer-form')).toBeInTheDocument();
  });

  it('abre o modal de confirmação de deleção ao clicar em deletar', () => {
    render(<CustomersPage />);

    const deleteButton = screen.getByTestId('delete-customer-button');
    fireEvent.click(deleteButton);

    expect(screen.getByTestId('delete-customer-dialog')).toBeInTheDocument();
  });

  it('abre o perfil do cliente ao clicar no botão Ver Detalhes na tabela', async () => {
    render(<CustomersPage />);

    const viewButton = screen.getByText('Ver Detalhes');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('customer-profile')).toBeInTheDocument();
    });
  });

  it('exibe toast de sucesso após criar um cliente', async () => {
    mockCreateCustomer.mockResolvedValue({ id: '2', name: 'Novo' });
    
    render(<CustomersPage />);

    // Abrir form
    fireEvent.click(screen.getByTestId('create-customer-button'));
    
    // Preencher e submeter (mocking the internal submit)
    // Note: We are testing the integration in the page
    const nameInput = screen.getByTestId('customer-name-input');
    const emailInput = screen.getByTestId('customer-email-input');
    fireEvent.change(nameInput, { target: { value: 'Novo' } });
    fireEvent.change(emailInput, { target: { value: 'novo@example.com' } });
    
    fireEvent.click(screen.getByTestId('submit-customer-form'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success',
        message: 'Cliente criado com sucesso!'
      }));
    });
  });
});
