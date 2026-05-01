"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrinterHandlers = setupPrinterHandlers;
const electron_1 = require("electron");
const ptp = __importStar(require("pdf-to-printer"));
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
            await ptp.print(filePath, options);
            return true;
        }
        catch (error) {
            console.error('Failed to print PDF:', error);
            return false;
        }
    });
}
//# sourceMappingURL=printer.js.map