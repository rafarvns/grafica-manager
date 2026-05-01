import React, { useState, useMemo, useCallback } from 'react';
import { PrinterSelector } from '@/components/domain/PrinterSelector/PrinterSelector';
import { OrderSelector } from '@/components/domain/OrderSelector';
import { PrintConfigPanel, PrintConfig } from '@/components/domain/PrintConfigPanel';
import { PrintDivergenceModal, DivergenceField } from '@/components/domain/PrintDivergenceModal';
import { PdfFilePicker } from '@/components/domain/PdfFilePicker';
import { PdfPreview } from '@/components/domain/PdfPreview';
import { useNotification } from '@/contexts/NotificationContext';
import { usePrintConfiguration } from '@/hooks/usePrintConfiguration';
import { apiClient } from '@/services/apiClient';
import type { Printer } from '@/types/printer';
import type { Order } from '@grafica/shared';
import styles from './PrintPage.module.css';

const DEFAULT_CONFIG: PrintConfig = {
  quality: 'normal',
  colorMode: 'CMYK',
  orientation: 'portrait',
  side: 'simplex',
  copies: 1,
  pageRanges: '',
};

function mapQuality(q: string): PrintConfig['quality'] {
  if (q === 'padrão') return 'normal';
  if (q === 'premium') return 'alta';
  return 'rascunho';
}

function mapColorMode(c: string): PrintConfig['colorMode'] {
  return c === 'P&B' ? 'GRAYSCALE' : 'CMYK';
}

const QUALITY_LABELS: Record<PrintConfig['quality'], string> = {
  rascunho: 'Rascunho',
  normal: 'Normal',
  alta: 'Alta',
};

const COLOR_LABELS: Record<PrintConfig['colorMode'], string> = {
  GRAYSCALE: 'Preto e branco',
  CMYK: 'Colorido (CMYK)',
  RGB: 'Colorido (RGB)',
};

function buildDivergenceFields(
  divergences: Set<keyof PrintConfig>,
  config: PrintConfig,
  orderConfig: Partial<PrintConfig> | null
): DivergenceField[] {
  if (!orderConfig) return [];

  const result: DivergenceField[] = [];

  if (divergences.has('quality')) {
    result.push({
      label: 'Qualidade',
      expected: QUALITY_LABELS[orderConfig.quality as PrintConfig['quality']] ?? String(orderConfig.quality),
      current: QUALITY_LABELS[config.quality],
    });
  }

  if (divergences.has('colorMode')) {
    result.push({
      label: 'Cor',
      expected: COLOR_LABELS[orderConfig.colorMode as PrintConfig['colorMode']] ?? String(orderConfig.colorMode),
      current: COLOR_LABELS[config.colorMode],
    });
  }

  if (divergences.has('copies')) {
    result.push({
      label: 'Cópias',
      expected: String(orderConfig.copies),
      current: String(config.copies),
    });
  }

  if (divergences.has('pageRanges')) {
    result.push({
      label: 'Intervalo de Páginas',
      expected: orderConfig.pageRanges || '(todas)',
      current: config.pageRanges || '(todas)',
    });
  }

  return result;
}

export function PrintPage() {
  const { notify } = useNotification();
  const { priceTable } = usePrintConfiguration();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderId, setOrderId] = useState('');
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [config, setConfig] = useState<PrintConfig>(DEFAULT_CONFIG);
  const [orderConfig, setOrderConfig] = useState<Partial<PrintConfig> | null>(null);
  const [orderMaxPages, setOrderMaxPages] = useState<number | undefined>(undefined);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [showDivergenceModal, setShowDivergenceModal] = useState(false);

  const divergences = useMemo((): Set<keyof PrintConfig> => {
    if (!orderConfig) return new Set();
    const keys = Object.keys(orderConfig) as (keyof PrintConfig)[];
    return new Set(keys.filter((k) => config[k] !== orderConfig[k]));
  }, [config, orderConfig]);

  const canPrint = !!selectedOrder && !!printer && !!filePath && !printing;

  const handleOrderChange = useCallback(
    (id: string, order: Order | null) => {
      setOrderId(id);
      setSelectedOrder(order);

      if (order?.priceTableEntryId) {
        const entry = priceTable.find((e) => e.id === order.priceTableEntryId);
        if (entry) {
          const maxPg = entry.maxPages ?? 1;
          const derived: Partial<PrintConfig> = {
            quality: mapQuality(entry.quality),
            colorMode: mapColorMode(entry.colors),
            copies: order.quantity,
            pageRanges: maxPg > 1 ? `1-${maxPg}` : '1',
          };
          setOrderConfig(derived);
          setOrderMaxPages(maxPg);
          setConfig((prev) => ({ ...prev, ...derived }));
          return;
        }
      }

      setOrderConfig(null);
      setOrderMaxPages(undefined);
      setConfig(DEFAULT_CONFIG);
    },
    [priceTable]
  );

  const executePrint = useCallback(async () => {
    if (!printer || !filePath || !selectedOrder) return;

    setPrinting(true);
    let status: 'success' | 'error' = 'success';
    let errorMessage: string | undefined;

    try {
      const success = await window.electronAPI?.printPdf(filePath, {
        printer: printer.name,
        orientation: config.orientation,
        side: config.side,
        copies: config.copies,
        monochrome: config.colorMode === 'GRAYSCALE',
        silent: true,
        ...(config.pageRanges ? { pages: config.pageRanges } : {}),
      });

      if (!success) {
        status = 'error';
        errorMessage = 'Impressão retornou falha';
      }
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    }

    try {
      await apiClient.post('/print-jobs', {
        orderId: orderId || undefined,
        printerName: printer.name,
        quality: config.quality,
        colorMode: config.colorMode,
        documentName: filePath.split(/[\\/]/).pop(),
        pageRanges: config.pageRanges || undefined,
        status,
        errorMessage,
      });
    } catch {
      // Falha no registro não bloqueia o usuário
    }

    if (status === 'success') {
      notify({ message: 'Impressão enviada com sucesso', type: 'success' });
      setFilePath(null);
    } else {
      notify({ message: `Falha na impressão: ${errorMessage}`, type: 'error' });
    }

    setPrinting(false);
  }, [printer, filePath, selectedOrder, orderId, config, notify]);

  const handlePrint = async () => {
    if (!printer || !filePath || !selectedOrder) return;

    if (divergences.size > 0) {
      setShowDivergenceModal(true);
      return;
    }

    await executePrint();
  };

  const handleDivergenceConfirm = useCallback(() => {
    setShowDivergenceModal(false);
    executePrint();
  }, [executePrint]);

  return (
    <>
      <PrintDivergenceModal
        isOpen={showDivergenceModal}
        onClose={() => setShowDivergenceModal(false)}
        onConfirm={handleDivergenceConfirm}
        fields={buildDivergenceFields(divergences, config, orderConfig)}
      />

      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Impressões</h1>
        </header>

        <div className={styles.body}>
          {/* Coluna esquerda — configuração */}
          <div className={styles.sidebar}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Pedido</h2>
              <OrderSelector
                value={orderId}
                onChange={handleOrderChange}
                disabled={printing}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Impressora</h2>
              <PrinterSelector onSelect={setPrinter} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Configurações</h2>
              <PrintConfigPanel
                config={config}
                onChange={setConfig}
                disabled={printing}
                warnings={divergences}
                {...(orderMaxPages !== undefined ? { maxPages: orderMaxPages } : {})}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Arquivo PDF</h2>
              <PdfFilePicker
                filePath={filePath}
                onSelect={setFilePath}
                disabled={printing}
              />
            </section>

            <button
              className={styles.printButton}
              onClick={handlePrint}
              disabled={!canPrint}
            >
              {printing ? 'Enviando para impressora...' : 'Imprimir'}
            </button>
          </div>

          {/* Coluna direita — preview */}
          <div className={styles.preview}>
            <PdfPreview
              filePath={filePath}
              colorMode={config.colorMode}
              orientation={config.orientation}
            />
          </div>
        </div>
      </div>
    </>
  );
}
