import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePriceTable } from '@/hooks/usePriceTable';
import { priceTableService } from '@/services/priceTableService';
import type { PriceTableEntry, CreatePriceTableEntryDTO, UpdatePriceTableEntryDTO } from '@grafica/shared/types';

vi.mock('@/services/priceTableService', () => ({
  priceTableService: {
    getPrices: vi.fn(),
    createPrice: vi.fn(),
    updatePrice: vi.fn(),
    deletePrice: vi.fn(),
  },
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({
    addToast: vi.fn(),
  }),
}));

describe('usePriceTable', () => {
  const mockPrices: PriceTableEntry[] = [
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

  beforeEach(() => {
    vi.clearAllMocks();
    (priceTableService.getPrices as any).mockResolvedValue(mockPrices);
  });

  describe('fetchPrices', () => {
    it('carrega preços ao montar o hook', async () => {
      const { result } = renderHook(() => usePriceTable());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.prices).toEqual(mockPrices);
      expect(priceTableService.getPrices).toHaveBeenCalled();
    });

    it('define loading=true durante fetch e loading=false no finally', async () => {
      const { result } = renderHook(() => usePriceTable());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('limpa erro ao buscar com sucesso', async () => {
      (priceTableService.getPrices as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      (priceTableService.getPrices as any).mockResolvedValueOnce(mockPrices);

      await act(async () => {
        await result.current.fetchPrices();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.prices).toEqual(mockPrices);
    });

    it('preenche error quando getPrices lança exceção', async () => {
      const errorMessage = 'Falha ao carregar preços';
      (priceTableService.getPrices as any).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.prices).toEqual([]);
    });
  });

  describe('createPrice', () => {
    it('chama priceTableService.createPrice com dados corretos incluindo colors', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newPrice: CreatePriceTableEntryDTO = {
        paperTypeId: 'paper-789',
        quality: 'premium',
        colors: 'colorido',
        unitPrice: 1.0,
      };

      (priceTableService.createPrice as any).mockResolvedValueOnce({
        id: 'price-3',
        ...newPrice,
        createdAt: new Date(),
      });

      await act(async () => {
        await result.current.createPrice(newPrice);
      });

      expect(priceTableService.createPrice).toHaveBeenCalledWith(newPrice);
    });

    it('recarrega preços após criar com sucesso', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newPrice: CreatePriceTableEntryDTO = {
        paperTypeId: 'paper-789',
        quality: 'premium',
        colors: 'P&B',
        unitPrice: 1.0,
      };

      const createdPrice: PriceTableEntry = {
        id: 'price-3',
        ...newPrice,
        createdAt: new Date(),
      };

      (priceTableService.createPrice as any).mockResolvedValueOnce(createdPrice);
      (priceTableService.getPrices as any).mockResolvedValueOnce([...mockPrices, createdPrice]);

      await act(async () => {
        await result.current.createPrice(newPrice);
      });

      // Verifica que fetchPrices foi chamado (getPrices chamado 2x: mount + after create)
      expect(priceTableService.getPrices).toHaveBeenCalledTimes(2);
    });

    it('preenche error quando createPrice lança exceção', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = 'Falha ao criar preço';
      (priceTableService.createPrice as any).mockRejectedValueOnce(new Error(errorMessage));

      const newPrice: CreatePriceTableEntryDTO = {
        paperTypeId: 'paper-789',
        quality: 'premium',
        colors: 'colorido',
        unitPrice: 1.0,
      };

      await act(async () => {
        try {
          await result.current.createPrice(newPrice);
        } catch {
          // Erro esperado
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('updatePrice', () => {
    it('chama priceTableService.updatePrice com id e dados corretos', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateData: UpdatePriceTableEntryDTO = {
        quality: 'premium',
        colors: 'colorido',
        unitPrice: 0.75,
      };

      const updatedPrice: PriceTableEntry = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        ...updateData,
        createdAt: mockPrices[0].createdAt,
      };

      (priceTableService.updatePrice as any).mockResolvedValueOnce(updatedPrice);

      await act(async () => {
        await result.current.updatePrice('price-1', updateData);
      });

      expect(priceTableService.updatePrice).toHaveBeenCalledWith('price-1', updateData);
    });

    it('recarrega preços após atualizar com sucesso', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateData: UpdatePriceTableEntryDTO = {
        quality: 'premium',
        colors: 'P&B',
        unitPrice: 0.75,
      };

      (priceTableService.updatePrice as any).mockResolvedValueOnce({
        id: 'price-1',
        paperTypeId: 'paper-123',
        ...updateData,
        createdAt: mockPrices[0].createdAt,
      });

      (priceTableService.getPrices as any).mockResolvedValueOnce(mockPrices);

      await act(async () => {
        await result.current.updatePrice('price-1', updateData);
      });

      expect(priceTableService.getPrices).toHaveBeenCalledTimes(2);
    });

    it('preenche error quando updatePrice lança exceção', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = 'Falha ao atualizar preço';
      (priceTableService.updatePrice as any).mockRejectedValueOnce(new Error(errorMessage));

      const updateData: UpdatePriceTableEntryDTO = {
        quality: 'premium',
        colors: 'colorido',
        unitPrice: 0.75,
      };

      await act(async () => {
        try {
          await result.current.updatePrice('price-1', updateData);
        } catch {
          // Erro esperado
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('deletePrice', () => {
    it('chama priceTableService.deletePrice com id correto', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      (priceTableService.deletePrice as any).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.deletePrice('price-1');
      });

      expect(priceTableService.deletePrice).toHaveBeenCalledWith('price-1');
    });

    it('recarrega preços após deletar com sucesso', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      (priceTableService.deletePrice as any).mockResolvedValueOnce(undefined);
      (priceTableService.getPrices as any).mockResolvedValueOnce([mockPrices[1]]);

      await act(async () => {
        await result.current.deletePrice('price-1');
      });

      expect(priceTableService.getPrices).toHaveBeenCalledTimes(2);
    });

    it('preenche error quando deletePrice lança exceção', async () => {
      const { result } = renderHook(() => usePriceTable());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const errorMessage = 'Falha ao deletar preço';
      (priceTableService.deletePrice as any).mockRejectedValueOnce(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.deletePrice('price-1');
        } catch {
          // Erro esperado
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
