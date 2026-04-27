import { contextBridge, ipcRenderer } from 'electron';

// Expõe APIs mínimas e tipadas para o renderer via contextBridge.
// Nunca exponha ipcRenderer diretamente — apenas métodos explícitos.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getPrinters: () => ipcRenderer.invoke('printer:get-list'),
  printPdf: (filePath: string, options: any) => ipcRenderer.invoke('printer:print-pdf', filePath, options)
});
