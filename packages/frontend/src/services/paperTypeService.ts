import { apiClient } from './apiClient';

export interface PaperType {
  id: string;
  name: string;
  gsm?: number;
  size?: string;
  color?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperTypeDTO {
  name: string;
  gsm?: number;
  size?: string;
  color?: string;
}

class PaperTypeService {
  async listPaperTypes(params?: { activeOnly?: boolean }): Promise<PaperType[]> {
    const response = await apiClient.get<PaperType[]>('/settings/paper-types', { 
      params: params || {} 
    });
    return response.data;
  }

  async createPaperType(data: CreatePaperTypeDTO): Promise<PaperType> {
    const response = await apiClient.post<PaperType>('/settings/paper-types', data);
    return response.data;
  }

  async deletePaperType(id: string, force = false): Promise<void> {
    await apiClient.delete(`/settings/paper-types/${id}`, { 
      params: { force } 
    });
  }

  async toggleActive(id: string): Promise<PaperType> {
    const response = await apiClient.patch<PaperType>(`/settings/paper-types/${id}/toggle`, {});
    return response.data;
  }
}

export const paperTypeService = new PaperTypeService();
