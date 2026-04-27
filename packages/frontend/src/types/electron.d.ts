export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
  options: Record<string, string>;
}

export interface PrintOptions {
  printer?: string;
  pages?: string;
  subset?: string;
  orientation?: string;
  scale?: string;
  side?: string;
  copies?: number;
}

export interface IElectronAPI {
  platform: string;
  getPrinters: () => Promise<PrinterInfo[]>;
  printPdf: (filePath: string, options: PrintOptions) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
