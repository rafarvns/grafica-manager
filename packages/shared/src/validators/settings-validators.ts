import { z } from 'zod';

export const PaperSizeSchema = z.enum(['A4', 'A3', 'A5', 'Ofício', 'Carta', 'Outro']);
export const PrintQualitySchema = z.enum(['rascunho', 'padrão', 'premium']);
export const ColorModeSchema = z.enum(['P&B', 'colorido']);
export const FinishTypeSchema = z.enum(['nenhum', 'laminação', 'encadernação']);

export const PaperTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  weight: z.number().min(0, 'Peso deve ser positivo').default(0),
  size: PaperSizeSchema,
  color: z.string().min(1, 'Cor é obrigatória'),
  active: z.boolean().default(true),
});

export const PrintPresetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  paperTypeId: z.string().min(1, 'Papel é obrigatório'),
  quality: PrintQualitySchema,
  colors: ColorModeSchema,
  finish: FinishTypeSchema,
  active: z.boolean().default(true),
});

export const PriceTableEntrySchema = z.object({
  paperTypeId: z.string().min(1, 'Papel é obrigatório'),
  quality: PrintQualitySchema,
  colors: ColorModeSchema,
  unitPrice: z.number().min(0, 'Preço deve ser positivo'),
  validUntil: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().min(new Date(new Date().setHours(0, 0, 0, 0)), 'Data de validade deve ser hoje ou no futuro')),
  active: z.boolean().default(true),
});
