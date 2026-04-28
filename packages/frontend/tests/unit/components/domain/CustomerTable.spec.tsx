import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerTable } from '@/components/domain/CustomerTable';

const mockCustomers = [
  {
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
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    phone: '21987654321',
    address: 'Rua B, 456',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20000-000',
    notes: null,
    createdAt: new Date(),
    deletedAt: null,
  },
];

describe('CustomerTable Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnViewDetails = vi.fn();

  it('renderiza colunas corretas na tabela', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('Cidade')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('renderiza uma linha para cada cliente', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    const rows = screen.getAllByTestId('customer-row');
    expect(rows.length).toBe(mockCustomers.length);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
  });

  it('chama onEdit ao clicar no botão Editar', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomers[0].id);
  });

  it('chama onViewDetails ao clicar no botão Ver Detalhes', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    const viewButtons = screen.getAllByText('Ver Detalhes');
    fireEvent.click(viewButtons[0]);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockCustomers[0].id);
  });

  it('chama onViewDetails ao clicar no nome do cliente', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    const nameCell = screen.getByText('João Silva');
    fireEvent.click(nameCell);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockCustomers[0].id);
  });

  it('desabilita o botão deletar quando o cliente tem pedidos ativos', () => {
    const activeOrderCounts = { '1': 3 }; // João Silva tem 3 pedidos ativos

    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={activeOrderCounts}
      />
    );

    const deleteButtons = screen.getAllByTestId('delete-customer-button');
    
    // João Silva (index 0) deve estar desabilitado
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[0]).toHaveAttribute('title', 'Não é possível deletar cliente com pedidos ativos');

    // Maria Oliveira (index 1) deve estar habilitado
    expect(deleteButtons[1]).not.toBeDisabled();
  });

  it('chama onDelete ao clicar no botão Deletar se estiver habilitado', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    const deleteButtons = screen.getAllByTestId('delete-customer-button');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCustomers[0].id);
  });

  it('possui atributos de acessibilidade corretos', () => {
    render(
      <CustomerTable
        customers={mockCustomers}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewDetails={mockOnViewDetails}
        activeOrderCounts={{}}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });
});
