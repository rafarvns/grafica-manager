import { z } from 'zod';

export const getPrintJobSchema = z.object({
  id: z.string().uuid('ID da impressão inválido'),
});

export type GetPrintJobInputRaw = z.infer<typeof getPrintJobSchema>;