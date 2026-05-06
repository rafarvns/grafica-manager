import { Printer, PrintOptions, PrintJobResult } from '../types/printer';

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
   * Retorna um discriminador: 'success' (impresso), 'cancelled' (usuário cancelou no
   * diálogo de Preferências) ou 'error' (falha real).
   */
  async printPdf(filePath: string, options: PrintOptions): Promise<PrintJobResult> {
    if (!window.electronAPI) {
      console.warn('electronAPI not available. Cannot print.');
      return { status: 'error', error: 'electronAPI indisponível' };
    }
    return window.electronAPI.printPdf(filePath, options);
  }
};
