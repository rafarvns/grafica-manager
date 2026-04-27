// Declaração global de window.electronAPI exposta pelo preload.ts
// Atualizar sempre que preload.ts expor novos métodos (na mesma PR).
export {};

declare global {
  interface Window {
    electronAPI: {
      /** Plataforma do SO: 'win32' | 'darwin' | 'linux' */
      platform: NodeJS.Platform;
      /** Obtém o API_TOKEN do main process via IPC seguro */
      getApiToken: () => Promise<string>;
    };
  }
}
