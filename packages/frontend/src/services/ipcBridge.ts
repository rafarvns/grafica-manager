import { IElectronAPI, PrinterInfo, PrintOptions } from '../types/electron';

/**
 * Wrapper para a API do Electron exposta via preload script.
 * Centraliza o acesso ao window.electronAPI e fornece tipos explícitos.
 */
export const ipcBridge: IElectronAPI = {
  platform: window.electronAPI?.platform || 'unknown',
  
  getPrinters: async (): Promise<PrinterInfo[]> => {
    return window.electronAPI.getPrinters();
  },

  printPdf: async (filePath: string, options: PrintOptions): Promise<boolean> => {
    return window.electronAPI.printPdf(filePath, options);
  },
};
