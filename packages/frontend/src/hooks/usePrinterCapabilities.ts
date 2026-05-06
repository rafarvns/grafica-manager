import { useEffect, useState } from 'react';
import { ipcBridge } from '@/services/ipcBridge';
import type { PrinterCapabilities } from '@/types/printer';

const DEFAULT: PrinterCapabilities = { supportsDuplex: true, supportsColor: true };
const cache = new Map<string, PrinterCapabilities>();

/**
 * Consulta as capacidades da impressora (duplex, cor) com cache em memória.
 *
 * Enquanto carrega ou em falha, retorna defaults permissivos
 * (`supportsDuplex: true`, `supportsColor: true`) — UI não restringe à toa.
 * Após a primeira consulta bem-sucedida, retorna os flags reais.
 */
export function usePrinterCapabilities(printerName: string | null): PrinterCapabilities {
  const [caps, setCaps] = useState<PrinterCapabilities>(() =>
    printerName && cache.has(printerName) ? cache.get(printerName)! : DEFAULT
  );

  useEffect(() => {
    if (!printerName) {
      setCaps(DEFAULT);
      return;
    }
    const cached = cache.get(printerName);
    if (cached) {
      setCaps(cached);
      return;
    }
    let cancelled = false;
    ipcBridge
      .getPrinterCapabilities(printerName)
      .then((result) => {
        if (cancelled) return;
        cache.set(printerName, result);
        setCaps(result);
      })
      .catch((err) => {
        console.warn('[usePrinterCapabilities] erro:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [printerName]);

  return caps;
}
