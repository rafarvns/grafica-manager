export interface OrderSummaryInCustomerReport {
  id: string;
  orderNumber: string;
  status: string;
  salePrice: number;
  totalPrintCost: number;
}

export interface GetCustomerSummaryOutput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  orders: OrderSummaryInCustomerReport[];
  totalOrders: number;
  ordersByStatus: {
    draft?: number;
    scheduled?: number;
    in_production?: number;
    completed?: number;
    shipping?: number;
    cancelled?: number;
  };
  totalSaleValue: number;
  totalPrintCost: number;
  totalMargin: number;
  totalPrintJobs: number;
  successfulPrintJobs: number;
  failedPrintJobs: number;
}
