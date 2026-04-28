import React, { useRef, useEffect } from 'react';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import styles from './PdfPreviewModal.module.css';

interface PdfPreviewModalProps {
  isOpen: boolean;
  filePath: string | null;
  onClose: () => void;
}

export function PdfPreviewModal({ isOpen, filePath, onClose }: PdfPreviewModalProps) {
  const {
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
    setZoom,
    renderPage,
  } = usePdfPreview();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carrega PDF ao abrir modal
  useEffect(() => {
    if (isOpen && filePath) {
      loadPdf(filePath);
    }
  }, [isOpen, filePath, loadPdf]);

  // Renderiza página quando currentPage ou zoom mudam
  useEffect(() => {
    if (isOpen && currentPage > 0) {
      renderPage(canvasRef);
    }
  }, [currentPage, zoom, isOpen, renderPage]);

  // Fechar ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>PDF Preview</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar preview">
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.navigationControls}>
            <button
              onClick={previousPage}
              disabled={currentPage <= 1 || loading}
              title="Página anterior (Seta para cima)"
              aria-label="Página anterior"
            >
              ← Anterior
            </button>

            <span className={styles.pageInfo}>{pageInfo.label}</span>

            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value, 10) || 1)}
              disabled={loading}
              className={styles.pageInput}
              aria-label="Ir para página"
            />

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || loading}
              title="Próxima página (Seta para baixo)"
              aria-label="Próxima página"
            >
              Próxima →
            </button>
          </div>

          <div className={styles.zoomControls}>
            <button
              onClick={zoomOut}
              disabled={zoom <= 50 || loading}
              title="Reduzir zoom"
              aria-label="Reduzir zoom"
            >
              −
            </button>

            <span className={styles.zoomLevel}>{zoom}%</span>

            <input
              type="range"
              min="50"
              max="300"
              step="25"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value, 10))}
              disabled={loading}
              className={styles.zoomSlider}
              aria-label="Nível de zoom"
            />

            <button
              onClick={zoomIn}
              disabled={zoom >= 300 || loading}
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading && <div className={styles.spinner}>Carregando PDF...</div>}
          {error && <div className={styles.error}>Erro: {error}</div>}
          {!loading && !error && (
            <div className={styles.canvasContainer}>
              <canvas ref={canvasRef} className={styles.canvas} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            {loading ? 'Carregando...' : `${currentPage} de ${totalPages} páginas`}
          </p>
        </div>
      </div>
    </div>
  );
}
