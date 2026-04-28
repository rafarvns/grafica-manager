import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteModal } from '@/components/domain/ConfirmDeleteModal';

describe('ConfirmDeleteModal Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  it('renderiza corretamente com o nome do cliente', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('delete-customer-dialog')).toBeInTheDocument();
    expect(screen.getByText(/João Silva/)).toBeInTheDocument();
    expect(screen.getByText(/Essa ação não pode ser desfeita/)).toBeInTheDocument();
  });

  it('habilita o botão Confirmar quando não há pedidos ativos', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-delete');
    expect(confirmButton).not.toBeDisabled();
  });

  it('desabilita o botão Confirmar e mostra aviso quando há pedidos ativos', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={3}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-delete');
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText(/Não é possível deletar cliente com pedidos ativos/)).toBeInTheDocument();
    expect(screen.getByText(/3 pedido\(s\) ativo\(s\)/)).toBeInTheDocument();
  });

  it('chama onConfirm ao clicar no botão Confirmar', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-delete');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('chama onCancel ao clicar no botão Cancelar ou fechar', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('possui role="dialog" para acessibilidade', () => {
    render(
      <ConfirmDeleteModal
        customerName="João Silva"
        activeOrderCount={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
