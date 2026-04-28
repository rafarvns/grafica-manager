import { z } from 'zod';

export const listPrintJobsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['sucesso', 'erro', 'cancelada', 'pendente']).optional(),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  documentName: z.string().optional(),
  origin: z.enum(['SHOPEE', 'MANUAL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['date', 'cost', 'status', 'customer']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type ListPrintJobsInputRaw = z.infer<typeof listPrintJobsSchema>;