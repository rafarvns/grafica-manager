import { contextBridge, ipcRenderer } from 'electron';

// Expõe APIs mínimas e tipadas para o renderer via contextBridge.
// Nunca exponha ipcRenderer diretamente — apenas métodos explícitos.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Exemplo de canal futuro: send: (channel: string, data: unknown) => ipcRenderer.send(channel, data)
});
