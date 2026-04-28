import type { ID } from './index';

export type PaperSize = 'A4' | 'A3' | 'A5' | 'Ofício' | 'Carta' | 'Outro';
export type PrintQuality = 'rascunho' | 'padrão' | 'premium';
export type ColorMode = 'P&B' | 'colorido';
export type FinishType = 'nenhum' | 'laminação' | 'encadernação';

export interface PaperType {
  id: ID;
  name: string;
  weight: number; // g/m²
  size: PaperSize;
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PrintPreset {
  id: ID;
  name: string;
  paperTypeId: ID;
  paperTypeName?: string; // Para exibição
  quality: PrintQuality;
  colors: ColorMode;
  finish: FinishType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PriceTableEntry {
  id: ID;
  paperTypeId: ID;
  paperTypeName?: string;
  quality: PrintQuality;
  colors: ColorMode;
  unitPrice: number;
  validUntil: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreatePaperTypeDTO {
  name: string;
  weight: number;
  size: PaperSize;
  color: string;
  active?: boolean;
}

export interface UpdatePaperTypeDTO extends Partial<CreatePaperTypeDTO> {}

export interface CreatePrintPresetDTO {
  name: string;
  paperTypeId: ID;
  quality: PrintQuality;
  colors: ColorMode;
  finish: FinishType;
  active?: boolean;
}

export interface UpdatePrintPresetDTO extends Partial<CreatePrintPresetDTO> {}

export interface CreatePriceTableEntryDTO {
  paperTypeId: ID;
  quality: PrintQuality;
  colors: ColorMode;
  unitPrice: number;
  validUntil: string | Date;
  active?: boolean;
}

export interface UpdatePriceTableEntryDTO extends Partial<CreatePriceTableEntryDTO> {}
