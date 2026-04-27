"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrinterHandlers = setupPrinterHandlers;
const electron_1 = require("electron");
const pdf_to_printer_1 = __importDefault(require("pdf-to-printer"));
function setupPrinterHandlers() {
    electron_1.ipcMain.handle('printer:get-list', async () => {
        try {
            const windows = electron_1.BrowserWindow.getAllWindows();
            const win = windows[0];
            if (win) {
                return await win.webContents.getPrintersAsync();
            }
            return [];
        }
        catch (error) {
            console.error('Failed to get printers:', error);
            return [];
        }
    });
    electron_1.ipcMain.handle('printer:print-pdf', async (_, filePath, options) => {
        try {
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