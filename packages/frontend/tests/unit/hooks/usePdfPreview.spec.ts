import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import * as pdfjsLib from 'pdfjs-dist';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '3.11.174',
}));

// Mock ipcBridge — readFile reads PDF bytes via Electron IPC, unavailable in jsdom
vi.mock('@/services/ipcBridge', () => ({
  ipcBridge: {
    readFile: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  },
}));

describe('usePdfPreview', () => {
  let mockPdfDocument: any;
  let mockPdfPage: any;
  let mockCanvas: any;
  let mockContext: any;

  beforeEach(() => {
    // Setup canvas mock
    mockCanvas = document.createElement('canvas');
    mockContext = {
      drawImage: vi.fn(),
      clearRect: vi.fn(),
    };
    mockCanvas.getContext = vi.fn(() => mockContext);

    // Setup PDF page mock
    mockPdfPage = {
      getViewport: vi.fn((opts: any) => ({
        width: 600,
        height: 800,
        scale: opts.scale || 1,
      })),
      render: vi.fn(() => ({
        promise: Promise.resolve(),
      })),
      cleanup: vi.fn(),
    };

    // Setup PDF document mock
    mockPdfDocument = {
      numPages: 10,
      getPage: vi.fn((pageNum: number) => Promise.resolve(mockPdfPage)),
      cleanup: vi.fn(),
    };

    // Mock getDocument
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve(mockPdfDocument),
    } as any);

    // Mock HTMLCanvasElement — use original implementation for non-canvas elements
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Carregamento de PDF', () => {
    it('inicializa com estado padrão', () => {
      const { result } = renderHook(() => usePdfPreview());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('carrega PDF com sucesso e define total de páginas', async () => {
      const filePath = '/test/document.pdf';
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf(filePath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalPages).toBe(10);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it('define erro ao falhar carregamento de PDF', async () => {
      const filePath = '/invalid/path.pdf';
      const errorMessage = 'Failed to load PDF';

      const { ipcBridge } = await import('@/services/ipcBridge');
      vi.mocked(ipcBridge.readFile).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf(filePath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Navegação entre páginas', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });
    });

    it('navega para próxima página', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('navega para página anterior', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      act(() => {
        result.current.nextPage();
      });

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('não avança além da última página', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });

      // Jump to last page
      act(() => {
        result.current.goToPage(10);
      });

      expect(result.current.currentPage).toBe(10);

      // Try to go to next
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(10);
    });

    it('não retrocede antes da primeira página', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('navega para página específica', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('rejeita navegação para página inválida (número negativo)', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });

      act(() => {
        result.current.goToPage(-1);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('rejeita navegação para página além do total', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });

      act(() => {
        result.current.goToPage(15);
      });

      expect(result.current.currentPage).toBe(10);
    });
  });

  describe('Zoom', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });
    });

    it('aumenta zoom (zoomIn)', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.zoom).toBe(100);
      });

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(125);
    });

    it('diminui zoom (zoomOut)', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.zoom).toBe(100);
      });

      act(() => {
        result.current.zoomIn();
      });

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.zoom).toBe(100);
    });

    it('define zoom para valor específico', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.zoom).toBe(100);
      });

      act(() => {
        result.current.setZoom(150);
      });

      expect(result.current.zoom).toBe(150);
    });

    it('não permite zoom abaixo do mínimo (50%)', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.zoom).toBe(100);
      });

      act(() => {
        result.current.setZoom(25);
      });

      expect(result.current.zoom).toBe(50);
    });

    it('não permite zoom acima do máximo (300%)', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.zoom).toBe(100);
      });

      act(() => {
        result.current.setZoom(400);
      });

      expect(result.current.zoom).toBe(300);
    });
  });

  describe('Cleanup de recursos', () => {
    it('limpa recursos ao desmontar', async () => {
      const { result, unmount } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(10);
      });

      unmount();

      expect(mockPdfDocument.cleanup).toHaveBeenCalled();
    });
  });

  describe('Informações de página', () => {
    it('retorna informações corretas da página', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      expect(result.current.pageInfo).toEqual({
        current: 1,
        total: 10,
        label: '1 / 10',
      });
    });

    it('atualiza informações ao navegar', async () => {
      const { result } = renderHook(() => usePdfPreview());

      act(() => {
        result.current.loadPdf('/test/document.pdf');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.pageInfo).toEqual({
        current: 5,
        total: 10,
        label: '5 / 10',
      });
    });
  });
});
