import { ipcMain, BrowserWindow } from 'electron';
import ptp from 'pdf-to-printer';
import { PrintOptions } from '../../src/types/printer';

export function setupPrinterHandlers() {
  ipcMain.handle('printer:get-list', async () => {
    try {
      const windows = BrowserWindow.getAllWindows();
      const win = windows[0];
      if (win) {
        return await win.webContents.getPrintersAsync();
      }
      return [];
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  });

  ipcMain.handle('printer:print-pdf', async (_, filePath: string, options: PrintOptions) => {
    try {
      await ptp.print(filePath, options);
      return true;
    } catch (error) {
      console.error('Failed to print PDF:', error);
      return false;
    }
  });
}
