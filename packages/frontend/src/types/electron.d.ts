import type { PrintOptions, Printer, PrintJobResult, PrinterCapabilities, PrintPreferencesPrefill } from './printer';

export type { PrintOptions };
export type PrinterInfo = Printer;

export interface IElectronAPI {
  platform: string;
  getPrinters: () => Promise<Printer[]>;
  getPrinterCapabilities: (name: string) => Promise<PrinterCapabilities>;
  showPrinterPreferences: (name: string, prefill: PrintPreferencesPrefill) => Promise<boolean>;
  printPdf: (filePath: string, options: PrintOptions) => Promise<PrintJobResult>;
  openPdfDialog: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<Uint8Array>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
