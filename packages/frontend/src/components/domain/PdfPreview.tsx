import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { PrintConfig } from './PrintConfigPanel';
import styles from './PdfPreview.module.css';

interface PdfPreviewProps {
  filePath: string | null;
  colorMode: PrintConfig['colorMode'];
  orientation: PrintConfig['orientation'];
}

// Proporção A4: 210 × 297 mm
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
    compute();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compute, containerRef]);

  return size;
}

export function PdfPreview({ filePath, colorMode, orientation }: PdfPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = usePaperSize(containerRef, orientation);

  useEffect(() => {
    if (prevUrl.current) {
      URL.revokeObjectURL(prevUrl.current);
      prevUrl.current = null;
    }

    if (!filePath) {
      setBlobUrl(null);
      return;
    }

    console.log('[PdfPreview] solicitando leitura:', filePath);
    window.electronAPI?.readFile(filePath).then((buffer) => {
      console.log('[PdfPreview] buffer recebido, tipo:', Object.prototype.toString.call(buffer), 'tamanho:', (buffer as any)?.byteLength ?? (buffer as any)?.length);
      const blob = new Blob([buffer], { type: 'application/pdf' });
      console.log('[PdfPreview] blob criado, tamanho:', blob.size);
      // #zoom=100 força o visualizador do Chromium a abrir em 100%
      const url = URL.createObjectURL(blob) + '#zoom=100';
      console.log('[PdfPreview] blob URL:', url);
      prevUrl.current = url.split('#')[0];
      setBlobUrl(url);
    }).catch((err) => {
      console.error('[PdfPreview] erro ao ler arquivo:', err);
      setBlobUrl(null);
    });

    return () => {
      if (prevUrl.current) {
        URL.revokeObjectURL(prevUrl.current);
        prevUrl.current = null;
      }
    };
  }, [filePath]);

  if (!filePath) {
    return (
      <div className={styles.empty}>
        <p>Selecione um arquivo PDF para visualizar</p>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {blobUrl && width > 0 ? (
        <div
          className={styles.paper}
          style={{ width, height }}
        >
          <iframe
            className={`${styles.frame}${colorMode === 'GRAYSCALE' ? ` ${styles.grayscale}` : ''}`}
            src={blobUrl}
            title="Prévia do PDF"
          />
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Carregando prévia...
        </p>
      )}
    </div>
  );
}
