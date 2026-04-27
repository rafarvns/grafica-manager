"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrinterHandlers = setupPrinterHandlers;
const electron_1 = require("electron");
const pdf_to_printer_1 = __importDefault(require("pdf-to-printer"));
const fs_1 = __importDefault(require("fs"));
const isDev = process.env['NODE_ENV'] === 'development';
function setupPrinterHandlers() {
    electron_1.ipcMain.handle('printer:get-list', async () => {
        try {
            const windows = electron_1.BrowserWindow.getAllWindows();
            const win = windows[0];
            let printers = [];
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
        }
        catch (error) {
            console.error('Failed to get printers:', error);
            return [];
        }
    });
    electron_1.ipcMain.handle('printer:print-pdf', async (_, filePath, options) => {
        try {
            // Se estiver em dev e o arquivo não existir, simulamos sucesso para teste de fluxo
            if (isDev && !fs_1.default.existsSync(filePath)) {
                console.log(`[MOCK] Simulando impressão de ${filePath} em ${options.printer}`);
                // Simulamos um tempo de processamento
                await new Promise((resolve) => setTimeout(resolve, 1500));
                return true;
            }
            await pdf_to_printer_1.default.print(filePath, options);
            return true;
        }
        catch (error) {
            console.error('Failed to print PDF:', error);
            return false;
        }
    });
}
//# sourceMappingURL=printer.js.map