import { IElectronAPI, PrinterInfo, PrintOptions } from '../types/electron';
import type { PrintJobResult, PrinterCapabilities, PrintPreferencesPrefill } from '../types/printer';

/**
 * Wrapper para a API do Electron exposta via preload script.
 * Centraliza o acesso ao window.electronAPI e fornece tipos explícitos.
 */
export const ipcBridge: IElectronAPI = {
  platform: window.electronAPI?.platform || 'unknown',

  getPrinters: async (): Promise<PrinterInfo[]> => {
    return window.electronAPI.getPrinters();
  },

  getPrinterCapabilities: async (name: string): Promise<PrinterCapabilities> => {
    return window.electronAPI.getPrinterCapabilities(name);
  },

  showPrinterPreferences: async (name: string, prefill: PrintPreferencesPrefill): Promise<boolean> => {
    return window.electronAPI.showPrinterPreferences(name, prefill);
  },

  printPdf: async (filePath: string, options: PrintOptions): Promise<PrintJobResult> => {
    return window.electronAPI.printPdf(filePath, options);
  },

  readFile: async (filePath: string): Promise<ArrayBuffer> => {
    console.log('[PDF/ipc] ipcBridge.readFile invoked:', filePath);
    if (!window.electronAPI) {
      console.error('[PDF/ipc] window.electronAPI is undefined — preload may have failed');
      throw new Error('electronAPI not available');
    }
    if (typeof window.electronAPI.readFile !== 'function') {
      console.error('[PDF/ipc] window.electronAPI.readFile not a function:', window.electronAPI);
      throw new Error('electronAPI.readFile not exposed');
    }
    const result = await window.electronAPI.readFile(filePath);
    console.log('[PDF/ipc] readFile result:', {
      type: Object.prototype.toString.call(result),
      truthy: !!result,
      byteLength: (result as { byteLength?: number } | null | undefined)?.byteLength,
    });
    return result;
  },
};
