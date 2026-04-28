import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderFilters as OrderFiltersComponent } from '@/components/domain/OrderFilters';

describe('OrderFilters', () => {
  it('chama onFilterChange quando um filtro é alterado', () => {
    const onFilterChange = vi.fn();
    render(<OrderFiltersComponent filters={{}} onFilterChange={onFilterChange} />);

    const originSelect = screen.getByLabelText(/Origem/i);
    fireEvent.change(originSelect, { target: { value: 'SHOPEE' } });

    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'SHOPEE'
    }));
  });

  it('renderiza os status selecionados', () => {
    render(<OrderFiltersComponent filters={{ statuses: ['draft', 'in_production'] }} onFilterChange={() => {}} />);
    
    // Checkbox for draft should be checked
    const draftCheckbox = screen.getByLabelText('Rascunho') as HTMLInputElement;
    expect(draftCheckbox.checked).toBe(true);

    const cancelledCheckbox = screen.getByLabelText('Cancelado') as HTMLInputElement;
    expect(cancelledCheckbox.checked).toBe(false);
  });
});
