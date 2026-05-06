import { ipcMain, BrowserWindow } from 'electron';
import * as ptp from 'pdf-to-printer';
import { PrintOptions, PrintJobResult } from '../../src/types/printer';
import { showPrinterPreferences, type PrintPreferencesPrefill } from '../services/printerConfig';
import { getPrinterCapabilities } from '../services/printerCapabilities';
import { enqueueForPrinter } from '../services/printQueue';
import fs from 'fs';

const isDev = process.env['NODE_ENV'] === 'development';

async function performPtpPrint(filePath: string, options: PrintOptions): Promise<PrintJobResult> {
  try {
    const { quality: _omitQuality, printDialog: _omitDialog, skipPrinterDialog: _omitSkip, ...rest } = options;
    await ptp.print(filePath, { ...rest, silent: true });
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to print PDF:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function printWithDialogGate(filePath: string, options: PrintOptions): Promise<PrintJobResult> {
  const printerName = options.printer;
  if (!printerName) {
    return performPtpPrint(filePath, options);
  }

  if (options.skipPrinterDialog) {
    // Wizard de manual duplex (ou outro fluxo) já mostrou o gate antes; pula direto pro print.
    return performPtpPrint(filePath, options);
  }

  const confirmed = await showPrinterPreferences(printerName, {
    ...(options.orientation !== undefined ? { orientation: options.orientation } : {}),
    ...(options.copies !== undefined ? { copies: options.copies } : {}),
    ...(options.quality !== undefined ? { quality: options.quality } : {}),
    ...(options.monochrome !== undefined ? { monochrome: options.monochrome } : {}),
    ...(options.side !== undefined ? { side: options.side } : {}),
  });
  if (!confirmed) {
    return { status: 'cancelled' };
  }

  return performPtpPrint(filePath, options);
}

export function setupPrinterHandlers() {
  ipcMain.handle('printer:get-list', async () => {
    try {
      const windows = BrowserWindow.getAllWindows();
      const win = windows[0];
      let printers: any[] = [];

      if (win) {
        printers = await win.webContents.getPrintersAsync();
      }

      // Injeta impressoras de teste se estiver em desenvolvimento
      if (isDev) {
        printers.push({
          name: 'MOCK_ERROR_PRINTER',
          displayName: '🔥 Impressora com Atolamento',
          status: 4, // Exemplo de código de erro (Out of Paper / Jam)
          isDefault: false,
          options: {}
        });

        printers.push({
          name: 'MOCK_OFFLINE_PRINTER',
          displayName: '💤 Impressora Offline',
          status: 1, // Offline
          isDefault: false,
          options: {}
        });
      }

      return printers;
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  });

  ipcMain.handle('printer:show-preferences', async (_, printerName: string, prefill: PrintPreferencesPrefill | undefined) => {
    if (!printerName) return false;
    try {
      return await enqueueForPrinter(printerName, () => showPrinterPreferences(printerName, prefill));
    } catch (error) {
      console.error('Failed to show printer preferences:', error);
      return false;
    }
  });

  ipcMain.handle('printer:get-capabilities', async (_, printerName: string) => {
    try {
      return await getPrinterCapabilities(printerName);
    } catch (error) {
      console.error('Failed to get printer capabilities:', error);
      return { supportsDuplex: true, supportsColor: true };
    }
  });

  ipcMain.handle('printer:print-pdf', async (_, filePath: string, options: PrintOptions): Promise<PrintJobResult> => {
    console.log('[printer] print-pdf chamado:', { filePath, options });

    if (isDev && !fs.existsSync(filePath)) {
      console.log(`[MOCK] Simulando impressão de ${filePath} em ${options.printer}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { status: 'success' };
    }

    if (!options.printer) {
      return performPtpPrint(filePath, options);
    }

    const result = await enqueueForPrinter(options.printer, () => printWithDialogGate(filePath, options));
    console.log('[printer] print-pdf retorno:', result);
    return result;
  });
}
