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
const printerConfig_1 = require("../services/printerConfig");
const printerCapabilities_1 = require("../services/printerCapabilities");
const printQueue_1 = require("../services/printQueue");
const fs_1 = __importDefault(require("fs"));
const isDev = process.env['NODE_ENV'] === 'development';
async function performPtpPrint(filePath, options) {
    try {
        const { quality: _omitQuality, printDialog: _omitDialog, skipPrinterDialog: _omitSkip, ...rest } = options;
        await ptp.print(filePath, { ...rest, silent: true });
        return { status: 'success' };
    }
    catch (error) {
        console.error('Failed to print PDF:', error);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
async function printWithDialogGate(filePath, options) {
    const printerName = options.printer;
    if (!printerName) {
        return performPtpPrint(filePath, options);
    }
    if (options.skipPrinterDialog) {
        // Wizard de manual duplex (ou outro fluxo) já mostrou o gate antes; pula direto pro print.
        return performPtpPrint(filePath, options);
    }
    const confirmed = await (0, printerConfig_1.showPrinterPreferences)(printerName, {
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
    electron_1.ipcMain.handle('printer:show-preferences', async (_, printerName, prefill) => {
        if (!printerName)
            return false;
        try {
            return await (0, printQueue_1.enqueueForPrinter)(printerName, () => (0, printerConfig_1.showPrinterPreferences)(printerName, prefill));
        }
        catch (error) {
            console.error('Failed to show printer preferences:', error);
            return false;
        }
    });
    electron_1.ipcMain.handle('printer:get-capabilities', async (_, printerName) => {
        try {
            return await (0, printerCapabilities_1.getPrinterCapabilities)(printerName);
        }
        catch (error) {
            console.error('Failed to get printer capabilities:', error);
            return { supportsDuplex: true, supportsColor: true };
        }
    });
    electron_1.ipcMain.handle('printer:print-pdf', async (_, filePath, options) => {
        console.log('[printer] print-pdf chamado:', { filePath, options });
        if (isDev && !fs_1.default.existsSync(filePath)) {
            console.log(`[MOCK] Simulando impressão de ${filePath} em ${options.printer}`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return { status: 'success' };
        }
        if (!options.printer) {
            return performPtpPrint(filePath, options);
        }
        const result = await (0, printQueue_1.enqueueForPrinter)(options.printer, () => printWithDialogGate(filePath, options));
        console.log('[printer] print-pdf retorno:', result);
        return result;
    });
}
//# sourceMappingURL=printer.js.map