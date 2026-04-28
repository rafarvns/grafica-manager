import { PaperType, CreatePaperTypeDTO, UpdatePaperTypeDTO } from '@grafica/shared';

export interface PaperTypeRepository {
  create(data: CreatePaperTypeDTO): Promise<PaperType>;
  findById(id: string): Promise<PaperType | null>;
  findByName(name: string): Promise<PaperType | null>;
  findAll(filters?: { activeOnly?: boolean; includeDeleted?: boolean }): Promise<PaperType[]>;
  update(id: string, data: UpdatePaperTypeDTO): Promise<PaperType>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<PaperType>;
  countActiveOrders(paperTypeId: string): Promise<number>;
}
