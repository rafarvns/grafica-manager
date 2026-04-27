"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const isDev = process.env['NODE_ENV'] === 'development';
if (isDev) {
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: false // Vite handles renderer hot reload
        });
    }
    catch (err) {
        console.error('Error loading electron-reloader:', err);
    }
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    if (isDev) {
        win.loadURL('http://localhost:5173');
    }
    else {
        win.loadFile((0, path_1.join)(__dirname, '../renderer/index.html'));
    }
}
const printer_1 = require("./ipc/printer");
electron_1.app.whenReady().then(() => {
    (0, printer_1.setupPrinterHandlers)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=main.js.map