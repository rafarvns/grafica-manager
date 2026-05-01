"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFileHandlers = setupFileHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
function setupFileHandlers() {
    electron_1.ipcMain.handle('dialog:open-pdf', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            title: 'Selecionar arquivo PDF',
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            properties: ['openFile'],
        });
        if (result.canceled || result.filePaths.length === 0)
            return null;
        return result.filePaths[0];
    });
    electron_1.ipcMain.handle('fs:read-file', async (_, filePath) => {
        console.log('[fs:read-file] caminho recebido:', filePath);
        try {
            const buffer = fs_1.default.readFileSync(filePath);
            const uint8 = new Uint8Array(buffer);
            console.log('[fs:read-file] leitura OK, bytes:', uint8.byteLength);
            return uint8;
        }
        catch (err) {
            console.error('[fs:read-file] erro ao ler arquivo:', err);
            throw err;
        }
    });
}
//# sourceMappingURL=files.js.map