import { z } from 'zod';

export const reprocessPrintJobSchema = z.object({
  id: z.string().uuid('ID da impressão inválido'),
});

export type ReprocessPrintJobInputRaw = z.infer<typeof reprocessPrintJobSchema>;