import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintConfiguration } from '@/hooks/usePrintConfiguration';
import * as apiClient from '@/services/apiClient';

// Mock apiClient
vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usePrintConfiguration', () => {
  const mockPaperTypes = [
    { id: 'paper-1', name: 'Couchê Brilhante', weight: 150, standardSize: 'A4', color: 'Branco' },
    { id: 'paper-2', name: 'Sulfite', weight: 75, standardSize: 'A4', color: 'Branco' },
  ];

  const mockPresets = [
    {
      id: 'preset-1',
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-1',
      paperTypeName: 'Couchê Brilhante',
      quality: 'alta',
      dpi: 600,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Carregamento inicial', () => {
    it('deve carregar paper types e presets ao montar', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: mockPresets });
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.paperTypes).toEqual(mockPaperTypes);
      expect(result.current.presets).toEqual(mockPresets);
    });

    it('deve selecionar primeiro papel por padrão', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.configuration.paperTypeId).toBe('paper-1');
    });

    it('deve ter configuração padrão', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.configuration.colorMode).toBe('CMYK');
      expect(result.current.configuration.quality).toBe('normal');
      expect(result.current.configuration.dpi).toBe(300);
    });
  });

  describe('Configuração de parâmetros', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({ data: mockPaperTypes });
    });

    it('deve mudar color mode', async () => {
      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setColorMode('RGB');
      });

      expect(result.current.configuration.colorMode).toBe('RGB');
    });

    it('deve mudar quality', async () => {
      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setQuality('alta');
      });

      expect(result.current.configuration.quality).toBe('alta');
    });

    it('deve mudar DPI', async () => {
      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDPI(600);
      });

      expect(result.current.configuration.dpi).toBe(600);
    });

    it('deve mudar tipo de papel', async () => {
      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPaperType('paper-2');
      });

      expect(result.current.configuration.paperTypeId).toBe('paper-2');
    });
  });

  describe('Presets', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: mockPresets });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve salvar como preset', async () => {
      const newPreset = {
        id: 'preset-new',
        name: 'Novo Preset',
        colorMode: 'CMYK',
        paperTypeId: 'paper-1',
        paperTypeName: 'Couchê',
        quality: 'normal',
        dpi: 300,
        createdAt: new Date(),
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue({ data: newPreset });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveAsPreset('Novo Preset');
      });

      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/print-presets', {
        name: 'Novo Preset',
        colorMode: 'CMYK',
        paperTypeId: 'paper-1',
        quality: 'normal',
        dpi: 300,
      });

      expect(result.current.presets).toContainEqual(
        expect.objectContaining({ id: 'preset-new', name: 'Novo Preset' })
      );
    });

    it('deve carregar preset', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: mockPresets });
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.presets.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.loadPreset('preset-1');
      });

      expect(result.current.configuration).toEqual({
        colorMode: 'CMYK',
        paperTypeId: 'paper-1',
        quality: 'alta',
        dpi: 600,
      });
    });

    it('deve deletar preset', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: mockPresets });
        return Promise.resolve({ data: [] });
      });

      vi.mocked(apiClient.apiClient.delete).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.presets.length).toBe(1);
      });

      await act(async () => {
        await result.current.deletePreset('preset-1');
      });

      expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/api/print-presets/preset-1');
      expect(result.current.presets).toHaveLength(0);
    });
  });

  describe('Paper Types', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve criar novo tipo de papel', async () => {
      const newPaperType = {
        id: 'paper-new',
        name: 'Novo Papel',
        weight: 100,
        standardSize: 'A4',
        color: 'Branco',
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue({ data: newPaperType });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.paperTypes.length;

      await act(async () => {
        await result.current.createPaperType('Novo Papel', 100, 'A4', 'Branco');
      });

      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/paper-types', {
        name: 'Novo Papel',
        weight: 100,
        standardSize: 'A4',
        color: 'Branco',
      });

      expect(result.current.paperTypes).toHaveLength(initialCount + 1);
    });

    it('deve deletar tipo de papel', async () => {
      vi.mocked(apiClient.apiClient.delete).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.paperTypes.length).toBe(2);
      });

      await act(async () => {
        await result.current.deletePaperType('paper-1');
      });

      expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/api/paper-types/paper-1');
      expect(result.current.paperTypes).toHaveLength(1);
    });
  });

  describe('Reset', () => {
    beforeEach(() => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url) => {
        if (url === '/api/paper-types') return Promise.resolve({ data: mockPaperTypes });
        if (url === '/api/print-presets') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve resetar configuração', async () => {
      const { result } = renderHook(() => usePrintConfiguration());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setColorMode('RGB');
        result.current.setQuality('alta');
        result.current.setDPI(600);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.configuration).toEqual({
        colorMode: 'CMYK',
        paperTypeId: 'paper-1',
        quality: 'normal',
        dpi: 300,
      });
    });
  });
});
