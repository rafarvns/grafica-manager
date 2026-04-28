import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import * as printJobService from '@/services/printJobService';

// Mock do printJobService
vi.mock('@/services/printJobService', () => ({
  printJobService: {
    listPrintJobs: vi.fn(),
    getPrintJob: vi.fn(),
    reprocessPrintJob: vi.fn(),
    getStats: vi.fn(),
    exportPrintJobs: vi.fn(),
  },
}));

// Mock do fetch para tabela de preços
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePrintHistory', () => {
  const mockPrintJobs = [
    {
      id: 'job-1',
      documentName: 'design1.pdf',
      paperTypeId: 'paper-123',
      paperTypeName: 'Papel A4',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.00,
      orderId: 'order-001',
      orderNumber: 'PED-001',
      customerId: 'cust-1',
      customerName: 'Cliente 1',
      origin: 'MANUAL',
      createdAt: new Date('2026-04-25').toISOString(),
    },
    {
      id: 'job-2',
      documentName: 'design2.pdf',
      paperTypeId: 'paper-456',
      paperTypeName: 'Papel A3',
      quality: 'alta',
      colorMode: 'RGB',
      dpi: 600,
      pageCount: 20,
      status: 'sucesso',
      registeredCost: 20.00,
      orderId: 'order-002',
      orderNumber: 'PED-002',
      customerId: 'cust-2',
      customerName: 'Cliente 2',
      origin: 'SHOPEE',
      createdAt: new Date('2026-04-26').toISOString(),
    },
    {
      id: 'job-3',
      documentName: 'design3.pdf',
      paperTypeId: 'paper-789',
      paperTypeName: 'Papel Cartão',
      quality: 'rascunho',
      colorMode: 'GRAYSCALE',
      dpi: 150,
      pageCount: 5,
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      orderId: 'order-003',
      orderNumber: 'PED-003',
      customerId: 'cust-3',
      customerName: 'Cliente 3',
      origin: 'MANUAL',
      createdAt: new Date('2026-04-27').toISOString(),
    },
  ];

  const mockPaginatedResult = {
    data: mockPrintJobs,
    total: 3,
    page: 1,
    pageSize: 25,
  };

  const mockStats = {
    totalJobs: 3,
    totalCost: 25.00,
    successRate: 66.67,
  };

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
    mockFetch.mockReset();
  });

  describe('Carregamento inicial', () => {
    it('deve carregar histórico de impressões e estatísticas ao montar', async () => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPriceTable),
      });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.printJobs.length).toBe(3);
      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('Paginação', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve ter valores padrão de paginação', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalItems).toBe(3);
      expect(result.current.totalPages).toBe(1);
    });

    it('deve alterar página com setPage', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('deve alterar pageSize e resetar para página 1', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.pageSize).toBe(50);
      expect(result.current.page).toBe(1);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve ter sorting padrão (date, desc)', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sortBy).toBe('date');
      expect(result.current.sortOrder).toBe('desc');
    });

    it('deve alterar sorting com setSorting', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSorting('cost', 'asc');
      });

      expect(result.current.sortBy).toBe('cost');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve aplicar filtros com applyFilters', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ status: 'sucesso' });
      });

      await act(async () => {
        await result.current.applyFilters();
      });

      expect(printJobService.printJobService.listPrintJobs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sucesso' })
      );
    });

    it('deve limpar filtros com clearFilters', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFilters({ status: 'sucesso', customerId: 'cust-1' });
      });

      await act(async () => {
        await result.current.clearFilters();
      });

      expect(result.current.filters.status).toBeUndefined();
      expect(result.current.filters.customerId).toBeUndefined();
    });
  });

  describe('Detalhe de impressão', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve buscar detalhe de impressão com fetchPrintJobDetail', async () => {
      const mockDetail = {
        ...mockPrintJobs[0],
        printerId: 'printer-1',
        printerName: 'Impressora HP',
        pagesBlackAndWhite: 8,
        pagesColor: 2,
        costBreakdown: {
          paperCost: 3.00,
          marginCost: 1.00,
          discount: 0,
          total: 5.00,
        },
      };

      vi.mocked(printJobService.printJobService.getPrintJob).mockResolvedValue(mockDetail);

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const detail = await result.current.fetchPrintJobDetail('job-1');

      expect(detail).toEqual(mockDetail);
      expect(printJobService.printJobService.getPrintJob).toHaveBeenCalledWith('job-1');
    });

    it('deve limpar detalhe selecionado com clearSelectedJob', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.clearSelectedJob();
      });

      expect(result.current.selectedJob).toBeNull();
    });
  });

  describe('Reprocessar impressão', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve reprocessar impressão com sucesso', async () => {
      vi.mocked(printJobService.printJobService.reprocessPrintJob).mockResolvedValue({
        id: 'job-3',
        status: 'pendente',
        message: 'Impressão reprocessada com sucesso',
      });

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await result.current.reprocessJob('job-3');

      expect(success).toBe(true);
      expect(printJobService.printJobService.reprocessPrintJob).toHaveBeenCalledWith('job-3');
    });

    it('deve retornar false ao falhar reprocessamento', async () => {
      vi.mocked(printJobService.printJobService.reprocessPrintJob).mockRejectedValue(
        new Error('Erro ao reprocessar')
      );

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await result.current.reprocessJob('job-3');

      expect(success).toBe(false);
    });
  });

  describe('Exportar dados', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve chamar exportPrintJobs ao exportar CSV', async () => {
      const mockBlob = new Blob(['id,data\n1,test'], { type: 'text/csv' });
      vi.mocked(printJobService.printJobService.exportPrintJobs).mockResolvedValue(mockBlob);

      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockAnchor = document.createElement('a');
      const clickSpy = vi.spyOn(mockAnchor, 'click');
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportJobs('csv');
      });

      expect(printJobService.printJobService.exportPrintJobs).toHaveBeenCalledWith('csv', expect.any(Object));

      // Cleanup
      clickSpy.mockRestore();
    });
  });

  describe('Estatísticas', () => {
    beforeEach(() => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockResolvedValue(mockPaginatedResult);
      vi.mocked(printJobService.printJobService.getStats).mockResolvedValue(mockStats);
    });

    it('deve carregar estatísticas', async () => {
      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.stats?.totalJobs).toBe(3);
      expect(result.current.stats?.totalCost).toBe(25.00);
      expect(result.current.stats?.successRate).toBe(66.67);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve definir erro quando listPrintJobs falha', async () => {
      vi.mocked(printJobService.printJobService.listPrintJobs).mockRejectedValue(
        new Error('Erro de rede')
      );
      vi.mocked(printJobService.printJobService.getStats).mockRejectedValue(
        new Error('Erro de rede')
      );

      const { result } = renderHook(() => usePrintHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
