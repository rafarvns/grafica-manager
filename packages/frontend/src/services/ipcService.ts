export const ipcService = {
  /**
   * Solicita ao processo Main do Electron a leitura segura do TOKEN da API.
   * Dispara um erro descritivo se não estiver num ambiente Electron.
   */
  async getApiToken(): Promise<string> {
    if (!window.electronAPI?.getApiToken) {
      throw new Error('Ambiente Electron não detectado (window.electronAPI indisponível).');
    }
    return await window.electronAPI.getApiToken();
  },

  /**
   * Retorna a plataforma do sistema operacional atual
   */
  getPlatform(): NodeJS.Platform | undefined {
    return window.electronAPI?.platform;
  },
};
