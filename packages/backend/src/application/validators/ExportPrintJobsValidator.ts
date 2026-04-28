import { z } from 'zod';

export const exportPrintJobsSchema = z.object({
  format: z.enum(['csv', 'pdf'], {
    errorMap: () => ({ message: 'Formato inválido. Aceitos: csv, pdf' }),
  }),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['sucesso', 'erro', 'cancelada', 'pendente']).optional(),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  documentName: z.string().optional(),
  origin: z.enum(['SHOPEE', 'MANUAL']).optional(),
});

export type ExportPrintJobsInputRaw = z.infer<typeof exportPrintJobsSchema>;