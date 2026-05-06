"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expõe APIs mínimas e tipadas para o renderer via contextBridge.
// Nunca exponha ipcRenderer diretamente — apenas métodos explícitos.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    getPrinters: () => electron_1.ipcRenderer.invoke('printer:get-list'),
    getPrinterCapabilities: (name) => electron_1.ipcRenderer.invoke('printer:get-capabilities', name),
    showPrinterPreferences: (name, prefill) => electron_1.ipcRenderer.invoke('printer:show-preferences', name, prefill),
    printPdf: (filePath, options) => electron_1.ipcRenderer.invoke('printer:print-pdf', filePath, options),
    openPdfDialog: () => electron_1.ipcRenderer.invoke('dialog:open-pdf'),
    readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:read-file', filePath),
});
//# sourceMappingURL=preload.js.map