import { Printer, PrintOptions } from '../types/printer';

// Interface que reflete o objeto exposto no preload.ts
interface ElectronAPI {
  platform: string;
  getPrinters: () => Promise<Printer[]>;
  printPdf: (filePath: string, options: PrintOptions) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const printerService = {
  /**
   * Obtém a lista de impressoras do sistema.
   * Em ambiente de browser puro (sem Electron), retorna um array vazio.
   */
  async getPrinters(): Promise<Printer[]> {
    if (!window.electronAPI) {
      console.warn('electronAPI not available. Running in browser mode?');
      return [];
    }
    return window.electronAPI.getPrinters();
  },

  /**
   * Envia um arquivo PDF para impressão usando as opções configuradas.
   * @param filePath Caminho absoluto local para o PDF.
   * @param options Configurações de impressão.
   * @returns Verdadeiro se enviado com sucesso, Falso se houve erro.
   */
  async printPdf(filePath: string, options: PrintOptions): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('electronAPI not available. Cannot print.');
      return false;
    }
    return window.electronAPI.printPdf(filePath, options);
  }
};
