import { PriceTableEntry, CreatePriceTableEntryDTO, UpdatePriceTableEntryDTO } from '@grafica/shared';

export interface PriceTableRepository {
  create(data: CreatePriceTableEntryDTO): Promise<PriceTableEntry>;
  findById(id: string): Promise<PriceTableEntry | null>;
  findAll(filters?: { activeOnly?: boolean }): Promise<PriceTableEntry[]>;
update(id: string, data: UpdatePriceTableEntryDTO): Promise<PriceTableEntry>;
  delete(id: string): Promise<void>;
}
