import { PrintPreset, CreatePrintPresetDTO, UpdatePrintPresetDTO } from '@grafica/shared';

export interface PrintPresetRepository {
  create(data: CreatePrintPresetDTO): Promise<PrintPreset>;
  findById(id: string): Promise<PrintPreset | null>;
  findAll(filters?: { activeOnly?: boolean; includeDeleted?: boolean }): Promise<PrintPreset[]>;
  update(id: string, data: UpdatePrintPresetDTO): Promise<PrintPreset>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<PrintPreset>;
  countActiveOrders(presetId: string): Promise<number>;
}
