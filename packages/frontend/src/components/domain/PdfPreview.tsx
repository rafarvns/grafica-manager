import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { PrintConfig } from './PrintConfigPanel';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import styles from './PdfPreview.module.css';

interface PdfPreviewProps {
  filePath: string | null;
  colorMode: PrintConfig['colorMode'];
  orientation: PrintConfig['orientation'];
  onTotalPagesChange?: (total: number) => void;
}

const A4_RATIO_PORTRAIT = 210 / 297;
const A4_RATIO_LANDSCAPE = 297 / 210;

function usePaperSize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  orientation: 'portrait' | 'landscape'
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const compute = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxW = el.clientWidth - 32;
    const maxH = el.clientHeight - 32;
    const ratio = orientation === 'landscape' ? A4_RATIO_LANDSCAPE : A4_RATIO_PORTRAIT;

    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    setSize({ width: Math.floor(w), height: Math.floor(h) });
  }, [containerRef, orientation]);

  useEffect(() => {
    const el = containerRef.current;
    console.log('[PDF/component] usePaperSize effect: el=', el, 'rect=', el?.getBoundingClientRect());
    compute();
    if (!el) {
      console.warn('[PDF/component] usePaperSize: ref is null, ResizeObserver not attached');
      return;
    }
    const ro = new ResizeObserver(() => {
      console.log('[PDF/component] ResizeObserver fired');
      compute();
    });
    ro.observe(el);
    console.log('[PDF/component] ResizeObserver attached on', el);
    return () => ro.disconnect();
  }, [compute, containerRef]);

  return size;
}

export function PdfPreview({ filePath, colorMode, orientation, onTotalPagesChange }: PdfPreviewProps) {
  const {
    loading,
    error,
    currentPage,
    totalPages,
    loadPdf,
    renderPage,
    nextPage,
    previousPage,
  } = usePdfPreview();

  useEffect(() => {
    if (onTotalPagesChange) onTotalPagesChange(totalPages);
  }, [totalPages, onTotalPagesChange]);

  const paperAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = usePaperSize(paperAreaRef, orientation);

  useEffect(() => {
    console.log('[PDF/component] filePath effect:', { filePath });
    if (filePath) {
      console.log('[PDF/component] dispatching loadPdf');
      loadPdf(filePath);
    }
  }, [filePath, loadPdf]);

  useEffect(() => {
    console.log('[PDF/component] render effect:', {
      currentPage,
      totalPages,
      loading,
      error,
      hasCanvas: !!canvasRef.current,
      paper: { width, height },
    });
    if (currentPage > 0 && !loading && !error) {
      if (!canvasRef.current) {
        console.warn('[PDF/component] canvasRef is null — canvas not yet mounted');
        return;
      }
      console.log('[PDF/component] dispatching renderPage');
      renderPage(canvasRef);
    }
    // Deps intencionalmente NÃO incluem width/height: a canvas é dimensionada
    // pelo viewport do pdf.js, não pela caixa A4. Mudanças na caixa só
    // afetam o CSS (max-width/max-height).
  }, [currentPage, renderPage, loading, error]);

  useEffect(() => {
    console.log('[PDF/component] paper size changed:', { width, height, orientation });
  }, [width, height, orientation]);

  return (
    <div className={styles.outer}>
      <div className={styles.paperArea} ref={paperAreaRef}>
        {!filePath && (
          <div className={styles.empty}>
            <p>Selecione um arquivo PDF para visualizar</p>
          </div>
        )}
        {filePath && width > 0 && (
          <div className={styles.paper} style={{ width, height }}>
            {loading && <p className={styles.status}>Carregando prévia...</p>}
            {error && !loading && (
              <p className={styles.error}>Erro ao carregar PDF: {error}</p>
            )}
            {!loading && !error && (
              <canvas
                ref={canvasRef}
                className={`${styles.canvas}${colorMode === 'GRAYSCALE' ? ` ${styles.grayscale}` : ''}`}
              />
            )}
          </div>
        )}
      </div>

      {filePath && totalPages > 1 && !loading && !error && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.navButton}
            onClick={previousPage}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            ←
          </button>
          <span className={styles.pageInfo} aria-live="polite">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.navButton}
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            aria-label="Próxima página"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
