import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerFilters } from '@/components/domain/CustomerFilters';

describe('CustomerFilters Component', () => {
  const mockOnApply = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renderiza os 3 campos de filtro com labels corretas', () => {
    render(<CustomerFilters onApply={mockOnApply} onClear={mockOnClear} />);

    expect(screen.getByLabelText('Nome:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade:')).toBeInTheDocument();
  });

  it('chama onApply com os valores corretos ao clicar em Buscar', () => {
    render(<CustomerFilters onApply={mockOnApply} onClear={mockOnClear} />);

    fireEvent.change(screen.getByLabelText('Nome:'), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText('Cidade:'), { target: { value: 'São Paulo' } });

    fireEvent.click(screen.getByText('Buscar'));

    expect(mockOnApply).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      name: 'João',
      email: 'joao@example.com',
      city: 'São Paulo',
    });
  });

  it('limpa os campos e chama onClear ao clicar em Limpar', () => {
    render(<CustomerFilters onApply={mockOnApply} onClear={mockOnClear} />);

    const nameInput = screen.getByLabelText('Nome:');
    fireEvent.change(nameInput, { target: { value: 'João' } });
    expect(nameInput).toHaveValue('João');

    fireEvent.click(screen.getByText('Limpar'));

    expect(nameInput).toHaveValue('');
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('chama onApply automaticamente após debounce ao digitar no campo Nome', async () => {
    render(<CustomerFilters onApply={mockOnApply} onClear={mockOnClear} />);

    const nameInput = screen.getByLabelText('Nome:');
    fireEvent.change(nameInput, { target: { value: 'Silva' } });

    // Não deve chamar imediatamente
    expect(mockOnApply).not.toHaveBeenCalled();

    // Avancar o tempo (debounce de 400ms conforme o plano)
    vi.advanceTimersByTime(400);

    expect(mockOnApply).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Silva'
    }));
  });
});
