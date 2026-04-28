import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usePrintHistory', () => {
  const mockPrintJobs = [
    {
      id: 'job-1',
      documentName: 'design1.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.00,
      orderId: 'order-001',
      createdAt: new Date('2026-04-25').toISOString(),
    },
    {
      id: 'job-2',
      documentName: 'design2.pdf',
      paperTypeId: 'paper-456',
      quality: 'alta',
      colorMode: 'RGB',
      dpi: 600,
      pageCount: 20,
      status: 'sucesso',
      registeredCost: 20.00,
      orderId: 'order-002',
      createdAt: new Date('2026-04-26').toISOString(),
    },
    {
      id: 'job-3',
      documentName: 'design3.pdf',
      paperTypeId: 'paper-789',
      quality: 'rascunho',
      colorMode: 'GRAYSCALE',
      dpi: 150,
      pageCount: 5,
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      orderId: 'order-003',
      createdAt: new Date('2026-04-27').toISOString(),
    },
  ];

  const mockPriceTable = [
    {
      id: 'price-1',
      paperTypeId: 'paper-123',
      quality: 'normal',
      unitPrice: 0.50,
      createdAt: new Date('2026-04-20').toISOString(),
    },
    {
      id: 'price-2',
      paperTypeId: 'paper-456',
      quality: 'alta',
      unitPrice: 1.00,
      createdAt: new Date('2026-04-20').toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Carregamento inicial', () => {
    it('deve carregar histórico de impressões e tabela de preços ao montar', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url.includes('/api/print-jobs')) return Promise.resolve({ data: mockPrintJobs });
        if (url === '/api/price-table') return Promise.resolve({ data: mockPriceTable });
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.printJobs.length).toBe(3);
      expect(result.current.priceTable.length).toBe(2);
    });
  });

  describe('Histórico de Impressões', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url.includes('/api/print-jobs')) return Promise.resolve({ data: mockPrintJobs });
        if (url === '/api/price-table') return Promise.resolve({ data: mockPriceTable });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve buscar impressão por ID', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({ data: mockPrintJobs[0] });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const job = await result.current.fetchPrintJobById('job-1');

      expect(job?.documentName).toBe('design1.pdf');
      expect(job?.registeredCost).toBe(5.00);
    });

    it('deve calcular custo total correto', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.printJobs.length).toBeGreaterThan(0);
      });

      const total = result.current.getTotalCost(result.current.printJobs);
      expect(total).toBe(25.00); // 5 + 20 + 0
    });

    it('deve calcular taxa de sucesso correta', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.printJobs.length).toBeGreaterThan(0);
      });

      const rate = result.current.getSuccessRate(result.current.printJobs);
      expect(rate).toBe(66.66666666666666); // 2 de 3 = 66.67%
    });

    it('deve filtrar por período', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilters({
          startDate: new Date('2026-04-26'),
          endDate: new Date('2026-04-27'),
        });
      });

      await act(async () => {
        await result.current.fetchPrintHistory({
          startDate: new Date('2026-04-26'),
          endDate: new Date('2026-04-27'),
        });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=')
      );
    });

    it('deve filtrar por status', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchPrintHistory({ status: 'sucesso' });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('status=sucesso')
      );
    });
  });

  describe('Tabela de Preços', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url.includes('/api/print-jobs')) return Promise.resolve({ data: mockPrintJobs });
        if (url === '/api/price-table') return Promise.resolve({ data: mockPriceTable });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve buscar preço por tipo de papel e qualidade', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.priceTable.length).toBeGreaterThan(0);
      });

      const price = result.current.getPriceForPaperTypeAndQuality('paper-123', 'normal');

      expect(price).not.toBeNull();
      expect(price?.unitPrice).toBe(0.50);
    });

    it('deve retornar null se preço não existe', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.priceTable.length).toBeGreaterThan(0);
      });

      const price = result.current.getPriceForPaperTypeAndQuality('paper-invalid', 'normal');

      expect(price).toBeNull();
    });

    it('deve criar nova entrada de preço', async () => {
      const newPrice = {
        id: 'price-3',
        paperTypeId: 'paper-999',
        quality: 'normal',
        unitPrice: 0.75,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue({ data: newPrice });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.priceTable.length;

      await act(async () => {
        await result.current.createPriceEntry('paper-999', 'normal', 0.75);
      });

      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/price-table', {
        paperTypeId: 'paper-999',
        quality: 'normal',
        unitPrice: 0.75,
      });

      expect(result.current.priceTable.length).toBe(initialCount + 1);
    });

    it('deve atualizar entrada de preço', async () => {
      const updatedPrice = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.60,
        createdAt: mockPriceTable[0].createdAt,
      };

      vi.mocked(apiClient.apiClient.patch).mockResolvedValue({ data: updatedPrice });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.priceTable.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.updatePriceEntry('price-1', 0.60);
      });

      expect(apiClient.apiClient.patch).toHaveBeenCalledWith('/api/price-table/price-1', {
        unitPrice: 0.60,
      });

      const updated = result.current.priceTable.find((p) => p.id === 'price-1');
      expect(updated?.unitPrice).toBe(0.60);
    });

    it('deve deletar entrada de preço', async () => {
      vi.mocked(apiClient.apiClient.delete).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.priceTable.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.priceTable.length;

      await act(async () => {
        await result.current.deletePriceEntry('price-1');
      });

      expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/api/price-table/price-1');
      expect(result.current.priceTable.length).toBe(initialCount - 1);
    });
  });

  describe('Cálculos', () => {
    it('deve calcular custo total = 0 para lista vazia', async () => {
      const { result } = renderHook(() => usePrintHistory());

      const total = result.current.getTotalCost([]);
      expect(total).toBe(0);
    });

    it('deve calcular taxa de sucesso = 0 para lista vazia', async () => {
      const { result } = renderHook(() => usePrintHistory());

      const rate = result.current.getSuccessRate([]);
      expect(rate).toBe(0);
    });

    it('deve calcular taxa de sucesso = 100 para todas bem-sucedidas', async () => {
      const { result } = renderHook(() => usePrintHistory());

      const jobs = [
        { ...mockPrintJobs[0], status: 'sucesso' },
        { ...mockPrintJobs[1], status: 'sucesso' },
      ];

      const rate = result.current.getSuccessRate(jobs);
      expect(rate).toBe(100);
    });
  });
});
