import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import type { PriceTableEntry } from '@/hooks/usePrintHistory';

describe('PriceTableManager', () => {
  const mockPriceTable: PriceTableEntry[] = [
    {
      id: 'price-1',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      unitPrice: 0.50,
      createdAt: new Date('2026-04-29'),
    },
    {
      id: 'price-2',
      paperTypeId: 'paper-456',
      quality: 'rascunho',
      colors: 'P&B',
      unitPrice: 0.25,
      createdAt: new Date('2026-04-29'),
    },
  ];

  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnPricesUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização da tabela com coluna de cores', () => {
    it('deve renderizar coluna "Tipo de Cor" na tabela', () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      const colorHeader = headers.find(h => h.textContent?.includes('Tipo de Cor'));
      expect(colorHeader).toBeInTheDocument();
    });

    it('deve exibir "Colorido" para entrada com colors="colorido"', () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Colorido')).toBeInTheDocument();
    });

    it('deve exibir "P&B" para entrada com colors="P&B"', () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const pbElements = screen.getAllByText('P&B');
      expect(pbElements.length).toBeGreaterThan(0);
    });

    it('deve atualizar colSpan para 5 colunas (incluindo Tipo de Cor)', () => {
      render(
        <PriceTableManager
          priceTable={[]}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const tdElement = screen.getByText('Nenhuma entrada de preço configurada.').closest('td');
      expect(tdElement).toHaveAttribute('colspan', '5');
    });
  });

  describe('Formulário com seletor de cores', () => {
    it('deve renderizar seletor de cores no formulário', async () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const colorSelect = screen.getByTestId('new-price-colors');
        expect(colorSelect).toBeInTheDocument();
        expect(colorSelect).toHaveProperty('tagName', 'SELECT');
      });
    });

    it('deve ter opções "P&B" e "Colorido" no seletor de cores', async () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const colorSelect = screen.getByTestId('new-price-colors') as HTMLSelectElement;
        const options = Array.from(colorSelect.options).map(o => o.value);
        expect(options).toContain('P&B');
        expect(options).toContain('colorido');
      });
    });

    it('deve ter seletor de cores com valor padrão "P&B"', async () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const colorSelect = screen.getByTestId('new-price-colors') as HTMLSelectElement;
        expect(colorSelect.value).toBe('P&B');
      });
    });
  });

  describe('Validação do campo colors', () => {
    it('deve bloquear submit quando colors não está selecionado', async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const paperInput = screen.getByTestId('new-price-paper-type');
        const qualitySelect = screen.getByTestId('new-price-quality');
        const priceInput = screen.getByTestId('new-price-unit-price');
        const colorSelect = screen.getByTestId('new-price-colors') as HTMLSelectElement;
        const submitButton = screen.getByTestId('submit-new-price');

        // Definir valores mas deixar colors vazio
        fireEvent.change(paperInput, { target: { value: 'paper-123' } });
        fireEvent.change(qualitySelect, { target: { value: 'padrão' } });
        fireEvent.change(priceInput, { target: { value: '0.50' } });
        fireEvent.change(colorSelect, { target: { value: '' } });

        fireEvent.click(submitButton);
      });

      // onCreate não deveria ser chamado se colors está vazio
      await waitFor(() => {
        expect(mockOnCreate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Chamada de onCreate com colors', () => {
    it('deve chamar onCreate com (paperTypeId, quality, colors, unitPrice)', async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const paperInput = screen.getByTestId('new-price-paper-type');
        const qualitySelect = screen.getByTestId('new-price-quality');
        const priceInput = screen.getByTestId('new-price-unit-price');
        const colorSelect = screen.getByTestId('new-price-colors');
        const submitButton = screen.getByTestId('submit-new-price');

        fireEvent.change(paperInput, { target: { value: 'paper-789' } });
        fireEvent.change(qualitySelect, { target: { value: 'premium' } });
        fireEvent.change(priceInput, { target: { value: '1.00' } });
        fireEvent.change(colorSelect, { target: { value: 'colorido' } });

        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith('paper-789', 'premium', 'colorido', 1.00);
      });
    });
  });

  describe('Compatibilidade com QUALITIES', () => {
    it('deve usar quality values corretos: rascunho, padrão, premium', async () => {
      render(
        <PriceTableManager
          priceTable={mockPriceTable}
          onPricesUpdated={mockOnPricesUpdated}
          onCreate={mockOnCreate}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const createButton = screen.getByTestId('create-price-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const qualitySelect = screen.getByTestId('new-price-quality') as HTMLSelectElement;
        const options = Array.from(qualitySelect.options).map(o => o.value);
        expect(options).toContain('rascunho');
        expect(options).toContain('padrão');
        expect(options).toContain('premium');
        // Ensure 'alta' and 'normal' are NOT there
        expect(options).not.toContain('alta');
        expect(options).not.toContain('normal');
      });
    });
  });
});
