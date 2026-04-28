import { ID } from './index';

export type OrderStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'in_production' 
  | 'completed' 
  | 'shipping' 
  | 'cancelled';

export interface OrderAttachment {
  id: ID;
  orderId: ID;
  originalFilename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface OrderPrintJob {
  id: ID;
  printerName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

/** @deprecated Use PrintJobDTO from print-jobs.ts instead */
export type PrintJob = OrderPrintJob;

export interface StatusHistory {
  id: ID;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: ID;
  orderNumber: string;
  customerId: ID;
  customerName?: string;
  description: string;
  quantity: number;
  paperType: string;
  dimensions: string;
  deadline: string; // ISO Date
  salePrice: number;
  productionCost: number;
  status: OrderStatus;
  position: number;
  origin: 'SHOPEE' | 'MANUAL';
  attachments: OrderAttachment[];
  printJobs: OrderPrintJob[];
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDTO {
  customerId: ID;
  description: string;
  quantity: number;
  paperType: string;
  dimensions: string;
  deadline: string;
  salePrice: number;
  productionCost: number;
}

export interface UpdateOrderDTO extends Partial<CreateOrderDTO> {
  status?: OrderStatus;
  position?: number;
}

export interface OrderFilters {
  statuses?: OrderStatus[];
  customerId?: string;
  startDate?: string;
  endDate?: string;
  origin?: 'SHOPEE' | 'MANUAL' | 'ALL';
}
