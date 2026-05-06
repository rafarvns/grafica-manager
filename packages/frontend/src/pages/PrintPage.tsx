import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PrinterSelector } from '@/components/domain/PrinterSelector/PrinterSelector';
import { OrderSelector } from '@/components/domain/OrderSelector';
import { PrintConfigPanel, PrintConfig } from '@/components/domain/PrintConfigPanel';
import { PrintDivergenceModal, DivergenceField } from '@/components/domain/PrintDivergenceModal';
import { ManualDuplexWizard, type ManualDuplexCompletion } from '@/components/domain/ManualDuplexWizard';
import { PdfFilePicker } from '@/components/domain/PdfFilePicker';
import { PdfPreview } from '@/components/domain/PdfPreview';
import { useNotification } from '@/contexts/NotificationContext';
import { usePrintConfiguration } from '@/hooks/usePrintConfiguration';
import { usePrinterCapabilities } from '@/hooks/usePrinterCapabilities';
import { apiClient } from '@/services/apiClient';
import { ipcBridge } from '@/services/ipcBridge';
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

function sideToDuplexMode(side: PrintConfig['side']): string {
  switch (side) {
    case 'simplex': return 'simplex';
    case 'duplex': return 'hardware_long';
    case 'duplexshort': return 'hardware_short';
    case 'manualduplex': return 'manual_long';
    case 'manualduplexshort': return 'manual_short';
  }
}

function toIpcSide(s: PrintConfig['side']): 'simplex' | 'duplex' | 'duplexshort' {
  if (s === 'manualduplex' || s === 'manualduplexshort') return 'simplex';
  return s;
}

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
  const capabilities = usePrinterCapabilities(printer?.name ?? null);
  const [config, setConfig] = useState<PrintConfig>(DEFAULT_CONFIG);
  const [orderConfig, setOrderConfig] = useState<Partial<PrintConfig> | null>(null);
  const [orderMaxPages, setOrderMaxPages] = useState<number | undefined>(undefined);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [showDivergenceModal, setShowDivergenceModal] = useState(false);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Quando a impressora não suporta duplex automático, troca seleções de hardware duplex
  // para o equivalente manual (e vice-versa quando volta a suportar).
  useEffect(() => {
    setConfig((prev) => {
      const next = { ...prev };
      if (!capabilities.supportsDuplex) {
        if (prev.side === 'duplex') next.side = 'manualduplex';
        else if (prev.side === 'duplexshort') next.side = 'manualduplexshort';
      } else {
        if (prev.side === 'manualduplex') next.side = 'duplex';
        else if (prev.side === 'manualduplexshort') next.side = 'duplexshort';
      }
      if (!capabilities.supportsColor && prev.colorMode !== 'GRAYSCALE') {
        next.colorMode = 'GRAYSCALE';
      }
      return next.side === prev.side && next.colorMode === prev.colorMode ? prev : next;
    });
  }, [capabilities.supportsDuplex, capabilities.supportsColor]);

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

  const recordPrintJob = useCallback(
    async (params: {
      status: 'success' | 'cancelled' | 'error';
      errorMessage?: string | undefined;
      duplexMode: string;
    }) => {
      if (!printer || !filePath) return;
      try {
        await apiClient.post('/print-jobs', {
          orderId: orderId || undefined,
          printerName: printer.name,
          quality: config.quality,
          colorMode: config.colorMode,
          documentName: filePath.split(/[\\/]/).pop(),
          pageRanges: config.pageRanges || undefined,
          status: params.status,
          errorMessage: params.errorMessage,
          duplexMode: params.duplexMode,
        });
      } catch {
        // Falha no registro não bloqueia o usuário
      }
    },
    [printer, filePath, orderId, config]
  );

  const isManualDuplex = config.side === 'manualduplex' || config.side === 'manualduplexshort';

  const executePrint = useCallback(async () => {
    if (!printer || !filePath || !selectedOrder) return;

    // Manual duplex: gate Win32 abre primeiro (confirmação de quality/cor); se OK, entra no wizard.
    if (isManualDuplex) {
      if (pdfTotalPages <= 0) {
        notify({ message: 'Aguarde o PDF carregar antes de imprimir', type: 'error' });
        return;
      }
      if (pdfTotalPages === 1) {
        notify({ message: 'Documento de 1 página — usando frente única (manual duplex desnecessário)', type: 'info' });
        // Cai pro fluxo normal de simplex abaixo.
      } else {
        setPrinting(true);
        const confirmed = await ipcBridge.showPrinterPreferences(printer.name, {
          orientation: config.orientation,
          copies: config.copies,
          quality: config.quality,
          monochrome: config.colorMode === 'GRAYSCALE',
          side: 'simplex', // cada passagem do wizard é simplex
        });
        setPrinting(false);
        if (!confirmed) return; // cancelou no diálogo → silencioso, sem wizard
        setWizardOpen(true);
        return;
      }
    }

    setPrinting(true);

    let status: 'success' | 'cancelled' | 'error' = 'success';
    let errorMessage: string | undefined;

    try {
      const result = await window.electronAPI?.printPdf(filePath, {
        printer: printer.name,
        orientation: config.orientation,
        side: toIpcSide(config.side),
        copies: config.copies,
        monochrome: config.colorMode === 'GRAYSCALE',
        quality: config.quality,
        ...(config.pageRanges ? { pages: config.pageRanges } : {}),
      });

      if (!result) {
        status = 'error';
        errorMessage = 'electronAPI indisponível';
      } else if (result.status === 'cancelled') {
        status = 'cancelled';
      } else if (result.status === 'error') {
        status = 'error';
        errorMessage = result.error;
      }
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    }

    if (status !== 'cancelled') {
      await recordPrintJob({ status, errorMessage, duplexMode: sideToDuplexMode(config.side) });
    }

    if (status === 'success') {
      notify({ message: 'Impressão enviada com sucesso', type: 'success' });
      setFilePath(null);
    } else if (status === 'error') {
      notify({ message: `Falha na impressão: ${errorMessage}`, type: 'error' });
    }
    // 'cancelled' → silencioso: usuário cancelou no diálogo, sem ruído.

    setPrinting(false);
  }, [printer, filePath, selectedOrder, config, notify, isManualDuplex, pdfTotalPages, recordPrintJob]);

  const handleWizardRunPass = useCallback(
    async (pagesCsv: string) => {
      if (!printer || !filePath) {
        return { status: 'error' as const, error: 'Estado inválido para impressão' };
      }
      const result = await window.electronAPI?.printPdf(filePath, {
        printer: printer.name,
        orientation: config.orientation,
        side: 'simplex', // cada passagem é simplex; o duplex é manual
        copies: config.copies,
        monochrome: config.colorMode === 'GRAYSCALE',
        quality: config.quality,
        pages: pagesCsv,
        skipPrinterDialog: true,
      });
      return result ?? { status: 'error' as const, error: 'electronAPI indisponível' };
    },
    [printer, filePath, config]
  );

  const handleWizardComplete = useCallback(
    async (completion: ManualDuplexCompletion) => {
      setWizardOpen(false);
      const duplexMode = sideToDuplexMode(config.side);
      if (completion.status === 'success') {
        await recordPrintJob({ status: 'success', duplexMode });
        notify({ message: 'Documento impresso frente e verso', type: 'success' });
        setFilePath(null);
      } else if (completion.status === 'error') {
        await recordPrintJob({ status: 'error', errorMessage: completion.errorMessage, duplexMode });
        notify({ message: `Falha na impressão: ${completion.errorMessage}`, type: 'error' });
      } else if (completion.partial) {
        await recordPrintJob({ status: 'cancelled', errorMessage: 'Cancelado após primeira passagem', duplexMode });
        notify({ message: 'Impressão cancelada — apenas a frente foi impressa', type: 'info' });
      }
      // !partial cancel = silencioso
    },
    [config.side, notify, recordPrintJob]
  );

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

      {printer && filePath && (
        <ManualDuplexWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          totalPages={pdfTotalPages}
          flipType={config.side === 'manualduplexshort' ? 'short' : 'long'}
          printerName={printer.name}
          documentName={filePath.split(/[\\/]/).pop() ?? 'documento.pdf'}
          onRunPass={handleWizardRunPass}
          onComplete={handleWizardComplete}
        />
      )}

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
                capabilities={capabilities}
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
              onTotalPagesChange={setPdfTotalPages}
            />
          </div>
        </div>
      </div>
    </>
  );
}
