import React, { useState } from 'react';
import { PrinterSelector } from '@/components/domain/PrinterSelector/PrinterSelector';
import { OrderSelector } from '@/components/domain/OrderSelector';
import { PrintConfigPanel, PrintConfig } from '@/components/domain/PrintConfigPanel';
import { PdfFilePicker } from '@/components/domain/PdfFilePicker';
import { PdfPreview } from '@/components/domain/PdfPreview';
import { useNotification } from '@/contexts/NotificationContext';
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
};

export function PrintPage() {
  const { notify } = useNotification();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderId, setOrderId] = useState('');
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [config, setConfig] = useState<PrintConfig>(DEFAULT_CONFIG);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const canPrint = !!printer && !!filePath && !printing;

  const handlePrint = async () => {
    if (!printer || !filePath) return;

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
      });

      if (!success) {
        status = 'error';
        errorMessage = 'Impressão retornou falha';
      }
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    }

    // Registra no backend independente do resultado
    try {
      await apiClient.post('/print-jobs', {
        orderId: orderId || undefined,
        printerName: printer.name,
        quality: config.quality,
        colorMode: config.colorMode,
        documentName: filePath.split(/[\\/]/).pop(),
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
  };

  return (
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
              onChange={(id, order) => { setOrderId(id); setSelectedOrder(order); }}
              disabled={printing}
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Impressora</h2>
            <PrinterSelector onSelect={setPrinter} />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Configurações</h2>
            <PrintConfigPanel config={config} onChange={setConfig} disabled={printing} />
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
  );
}
