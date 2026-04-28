import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';

export type ColorMode = 'CMYK' | 'RGB' | 'GRAYSCALE';
export type Quality = 'rascunho' | 'normal' | 'alta';
export type DPI = 150 | 300 | 600;

export interface PaperType {
  id: string;
  name: string;
  weight: number;
  standardSize: string;
  color: string;
}

export interface PrintPreset {
  id: string;
  name: string;
  colorMode: ColorMode;
  paperTypeId: string;
  paperTypeName: string;
  quality: Quality;
  dpi: DPI;
  createdAt: Date;
}

export interface PrintConfiguration {
  colorMode: ColorMode;
  paperTypeId: string;
  quality: Quality;
  dpi: DPI;
}

interface UsePrintConfigurationReturn {
  // Estados
  configuration: PrintConfiguration;
  paperTypes: PaperType[];
  presets: PrintPreset[];
  loading: boolean;
  error: string | null;

  // Configurações
  setColorMode: (mode: ColorMode) => void;
  setPaperType: (paperTypeId: string) => void;
  setQuality: (quality: Quality) => void;
  setDPI: (dpi: DPI) => void;

  // Presets
  saveAsPreset: (name: string) => Promise<void>;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => Promise<void>;

  // Paper Types
  createPaperType: (name: string, weight: number, size: string, color: string) => Promise<void>;
  deletePaperType: (paperTypeId: string) => Promise<void>;

  // Reset
  reset: () => void;
}

const DEFAULT_CONFIGURATION: PrintConfiguration = {
  colorMode: 'CMYK',
  paperTypeId: '',
  quality: 'normal',
  dpi: 300,
};

export function usePrintConfiguration(): UsePrintConfigurationReturn {
  const [configuration, setConfiguration] = useState<PrintConfiguration>(DEFAULT_CONFIGURATION);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [paperTypesRes, presetsRes] = await Promise.all([
        apiClient.get('/api/paper-types'),
        apiClient.get('/api/print-presets'),
      ]);

      setPaperTypes(paperTypesRes.data || []);
      setPresets(presetsRes.data || []);

      // Se houver paper types, seleciona o primeiro por padrão
      if (paperTypesRes.data && paperTypesRes.data.length > 0) {
        setConfiguration((prev) => ({
          ...prev,
          paperTypeId: paperTypesRes.data[0].id,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setConfiguration((prev) => ({
      ...prev,
      colorMode: mode,
    }));
  }, []);

  const setPaperType = useCallback((paperTypeId: string) => {
    setConfiguration((prev) => ({
      ...prev,
      paperTypeId,
    }));
  }, []);

  const setQuality = useCallback((quality: Quality) => {
    setConfiguration((prev) => ({
      ...prev,
      quality,
    }));
  }, []);

  const setDPI = useCallback((dpi: DPI) => {
    setConfiguration((prev) => ({
      ...prev,
      dpi,
    }));
  }, []);

  const saveAsPreset = useCallback(
    async (name: string) => {
      try {
        setError(null);
        const response = await apiClient.post('/api/print-presets', {
          name,
          ...configuration,
        });

        const newPreset = response.data;
        setPresets((prev) => [...prev, newPreset]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar preset';
        setError(errorMessage);
        throw err;
      }
    },
    [configuration]
  );

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setConfiguration({
        colorMode: preset.colorMode,
        paperTypeId: preset.paperTypeId,
        quality: preset.quality,
        dpi: preset.dpi,
      });
    }
  }, [presets]);

  const deletePreset = useCallback(async (presetId: string) => {
    try {
      setError(null);
      await apiClient.delete(`/api/print-presets/${presetId}`);
      setPresets((prev) => prev.filter((p) => p.id !== presetId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar preset';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createPaperType = useCallback(
    async (name: string, weight: number, size: string, color: string) => {
      try {
        setError(null);
        const response = await apiClient.post('/api/paper-types', {
          name,
          weight,
          standardSize: size,
          color,
        });

        const newPaperType = response.data;
        setPaperTypes((prev) => [...prev, newPaperType]);

        // Se era a primeira, seleciona automaticamente
        if (paperTypes.length === 0) {
          setConfiguration((prev) => ({
            ...prev,
            paperTypeId: newPaperType.id,
          }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tipo de papel';
        setError(errorMessage);
        throw err;
      }
    },
    [paperTypes.length]
  );

  const deletePaperType = useCallback(async (paperTypeId: string) => {
    try {
      setError(null);
      await apiClient.delete(`/api/paper-types/${paperTypeId}`);
      setPaperTypes((prev) => prev.filter((p) => p.id !== paperTypeId));

      // Se foi o selecionado, seleciona outro
      if (configuration.paperTypeId === paperTypeId) {
        const remaining = paperTypes.filter((p) => p.id !== paperTypeId);
        setConfiguration((prev) => ({
          ...prev,
          paperTypeId: remaining.length > 0 ? remaining[0].id : '',
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tipo de papel';
      setError(errorMessage);
      throw err;
    }
  }, [configuration.paperTypeId, paperTypes]);

  const reset = useCallback(() => {
    setConfiguration(DEFAULT_CONFIGURATION);
    if (paperTypes.length > 0) {
      setConfiguration((prev) => ({
        ...prev,
        paperTypeId: paperTypes[0].id,
      }));
    }
  }, [paperTypes]);

  return {
    configuration,
    paperTypes,
    presets,
    loading,
    error,
    setColorMode,
    setPaperType,
    setQuality,
    setDPI,
    saveAsPreset,
    loadPreset,
    deletePreset,
    createPaperType,
    deletePaperType,
    reset,
  };
}
