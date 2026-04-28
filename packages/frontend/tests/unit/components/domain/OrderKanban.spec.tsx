import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderKanban } from '@/components/domain/OrderKanban';

describe('OrderKanban', () => {
  it('renderiza as 6 colunas do kanban', () => {
    render(<OrderKanban orders={[]} onMoveOrder={vi.fn()} onEdit={vi.fn()} />);
    
    expect(screen.getByText('Rascunho')).toBeDefined();
    expect(screen.getByText('Agendado')).toBeDefined();
    expect(screen.getByText('Em Produção')).toBeDefined();
    expect(screen.getByText('Concluído')).toBeDefined();
    expect(screen.getByText('Enviado')).toBeDefined();
    expect(screen.getByText('Cancelado')).toBeDefined();
  });
});
