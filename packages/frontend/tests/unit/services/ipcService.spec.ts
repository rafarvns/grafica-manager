import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcService } from '@/services/ipcService';

describe('ipcService', () => {
  beforeEach(() => {
    // Reset global window object mock before each test
    vi.stubGlobal('window', {
      electronAPI: undefined,
    });
  });

  it('getApiToken chama o método exposto pelo Electron', async () => {
    const mockToken = 'test-token-123';
    const mockGetApiToken = vi.fn().mockResolvedValue(mockToken);
    
    vi.stubGlobal('window', {
      electronAPI: {
        getApiToken: mockGetApiToken,
      },
    });

    const token = await ipcService.getApiToken();
    expect(mockGetApiToken).toHaveBeenCalledOnce();
    expect(token).toBe(mockToken);
  });

  it('lança erro se electronAPI não estiver disponível', async () => {
    // window.electronAPI undefined
    await expect(ipcService.getApiToken()).rejects.toThrow(
      'Ambiente Electron não detectado (window.electronAPI indisponível).',
    );
  });

  it('retorna a plataforma do SO', () => {
    vi.stubGlobal('window', {
      electronAPI: {
        platform: 'win32',
      },
    });

    const platform = ipcService.getPlatform();
    expect(platform).toBe('win32');
  });
});
