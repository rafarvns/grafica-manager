import { contextBridge, ipcRenderer } from 'electron';

// Expõe APIs mínimas e tipadas para o renderer via contextBridge.
// Nunca exponha ipcRenderer diretamente — apenas métodos explícitos.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getPrinters: () => ipcRenderer.invoke('printer:get-list'),
  getPrinterCapabilities: (name: string) => ipcRenderer.invoke('printer:get-capabilities', name),
  showPrinterPreferences: (name: string, prefill: any) => ipcRenderer.invoke('printer:show-preferences', name, prefill),
  printPdf: (filePath: string, options: any) => ipcRenderer.invoke('printer:print-pdf', filePath, options),
  openPdfDialog: () => ipcRenderer.invoke('dialog:open-pdf'),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
});
