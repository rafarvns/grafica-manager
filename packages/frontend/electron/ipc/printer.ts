import { ipcMain, BrowserWindow } from 'electron';
import ptp from 'pdf-to-printer';
import { PrintOptions } from '../../src/types/printer';
import fs from 'fs';

const isDev = process.env['NODE_ENV'] === 'development';

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

  ipcMain.handle('printer:print-pdf', async (_, filePath: string, options: PrintOptions) => {
    try {
      // Se estiver em dev e o arquivo não existir, simulamos sucesso para teste de fluxo
      if (isDev && !fs.existsSync(filePath)) {
        console.log(`[MOCK] Simulando impressão de ${filePath} em ${options.printer}`);
        // Simulamos um tempo de processamento
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return true;
      }

      await ptp.print(filePath, options);
      return true;
    } catch (error) {
      console.error('Failed to print PDF:', error);
      return false;
    }
  });
}
