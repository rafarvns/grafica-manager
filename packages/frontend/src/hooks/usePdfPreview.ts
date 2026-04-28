import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ipcBridge } from '@/services/ipcBridge';

// Configurar worker do pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;
const DEFAULT_ZOOM = 100;

interface PageInfo {
  current: number;
  total: number;
  label: string;
}

interface UsePdfPreviewReturn {
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  pageInfo: PageInfo;
  loadPdf: (filePath: string) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (pageNumber: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoomLevel: number) => void;
  renderPage: (canvasRef: React.RefObject<HTMLCanvasElement>) => Promise<void>;
}

export function usePdfPreview(): UsePdfPreviewReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pdfPageRef = useRef<pdfjsLib.PDFPageProxy | null>(null);

  const pageInfo: PageInfo = {
    current: currentPage,
    total: totalPages,
    label: `${currentPage} / ${totalPages}`,
  };

  // Carrega o PDF
  const loadPdf = useCallback(async (filePath: string) => {
    try {
      setLoading(true);
      setError(null);

      const pdfData = await ipcBridge.readFile(filePath);
      if (!pdfData) {
        throw new Error('Failed to read PDF file');
      }

      const typedArray = new Uint8Array(pdfData);
      const pdf = await pdfjsLib.getDocument({
        data: typedArray,
        disableAutoFetch: true,
      }).promise;

      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setZoom(DEFAULT_ZOOM);

      // Carrega primeira página
      const firstPage = await pdf.getPage(1);
      pdfPageRef.current = firstPage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Navega para próxima página
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Navega para página anterior
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Navega para página específica
  const goToPage = useCallback(
    (pageNumber: number) => {
      const validPageNumber = Math.max(1, Math.min(pageNumber, totalPages));
      setCurrentPage(validPageNumber);
    },
    [totalPages]
  );

  // Aumenta zoom
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  // Diminui zoom
  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  // Define zoom para valor específico
  const setZoomLevel = useCallback((zoomLevel: number) => {
    const validZoom = Math.max(MIN_ZOOM, Math.min(zoomLevel, MAX_ZOOM));
    setZoom(validZoom);
  }, []);

  // Renderiza página no canvas
  const renderPage = useCallback(
    async (canvasRef: React.RefObject<HTMLCanvasElement>) => {
      if (!pdfDocRef.current || !canvasRef.current) {
        return;
      }

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        pdfPageRef.current = page;

        const viewport = page.getViewport({
          scale: zoom / 100,
        });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render page';
        setError(errorMessage);
      }
    },
    [currentPage, zoom]
  );

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (pdfPageRef.current) {
        pdfPageRef.current.cleanup();
      }
      if (pdfDocRef.current) {
        pdfDocRef.current.cleanup();
      }
    };
  }, []);

  return {
    loading,
    error,
    currentPage,
    totalPages,
    zoom,
    pageInfo,
    loadPdf,
    nextPage,
    previousPage,
    goToPage,
    zoomIn,
    zoomOut,
    setZoom: setZoomLevel,
    renderPage,
  };
}
