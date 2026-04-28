import { useState, useEffect, useCallback } from 'react';
import { SystemSettings, UpdateSystemSettingsDto } from '@grafica/shared';
import { systemSettingsService } from '../services/systemSettingsService';
import { useToast } from './useToast';

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await systemSettingsService.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar configurações do sistema');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (data: UpdateSystemSettingsDto) => {
    try {
      setLoading(true);
      const updated = await systemSettingsService.updateSettings(data);
      setSettings(updated);
      addToast({ message: 'Configurações atualizadas com sucesso', type: 'success' });
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar configurações';
      addToast({ message: msg, type: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      setLoading(true);
      const result = await systemSettingsService.uploadLogo(file);
      setSettings(result.settings);
      addToast({ message: 'Logo atualizada com sucesso', type: 'success' });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar logo';
      addToast({ message: msg, type: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLogo = async () => {
    try {
      setLoading(true);
      await systemSettingsService.deleteLogo();
      if (settings) {
        setSettings({ ...settings, logoPath: null });
      }
      addToast({ message: 'Logo removida com sucesso', type: 'success' });
    } catch (err) {
      addToast({ message: 'Falha ao remover logo', type: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    deleteLogo,
    refresh: fetchSettings,
  };
}
