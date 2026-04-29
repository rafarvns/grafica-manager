import { apiClient } from './apiClient';
import type { PriceTableEntry, CreatePriceTableEntryDTO, UpdatePriceTableEntryDTO } from '@grafica/shared/types';

export const priceTableService = {
  async getPrices(): Promise<PriceTableEntry[]> {
    const response = await apiClient.get<PriceTableEntry[]>('/settings/prices');
    return response.data;
  },

  async createPrice(data: CreatePriceTableEntryDTO): Promise<PriceTableEntry> {
    const response = await apiClient.post<PriceTableEntry>('/settings/prices', data);
    return response.data;
  },

  async updatePrice(id: string, data: UpdatePriceTableEntryDTO): Promise<PriceTableEntry> {
    const response = await apiClient.put<PriceTableEntry>(`/settings/prices/${id}`, data);
    return response.data;
  },

  async deletePrice(id: string): Promise<void> {
    await apiClient.delete(`/settings/prices/${id}`);
  },
};
