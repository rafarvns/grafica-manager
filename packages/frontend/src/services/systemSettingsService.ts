import { apiClient } from './apiClient';
import { SystemSettings, UpdateSystemSettingsDto, ApiResponse } from '@grafica/shared';

export const systemSettingsService = {
  async getSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>('/system-settings');
    return response.data;
  },

  async updateSettings(data: UpdateSystemSettingsDto): Promise<SystemSettings> {
    const response = await apiClient.patch<SystemSettings>('/system-settings', data);
    return response.data;
  },

  async uploadLogo(file: File): Promise<{ message: string; settings: SystemSettings }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await apiClient.post<{ message: string; settings: SystemSettings }>(
      '/system-settings/logo', 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async deleteLogo(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/system-settings/logo');
    return response.data;
  }
};
