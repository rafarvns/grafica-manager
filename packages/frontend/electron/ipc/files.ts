import { ipcMain, dialog } from 'electron';
import fs from 'fs';

export function setupFileHandlers() {
  ipcMain.handle('dialog:open-pdf', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecionar arquivo PDF',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('fs:read-file', async (_, filePath: string) => {
    console.log('[fs:read-file] caminho recebido:', filePath);
    try {
      const buffer = fs.readFileSync(filePath);
      const uint8 = new Uint8Array(buffer);
      console.log('[fs:read-file] leitura OK, bytes:', uint8.byteLength);
      return uint8;
    } catch (err) {
      console.error('[fs:read-file] erro ao ler arquivo:', err);
      throw err;
    }
  });
}
