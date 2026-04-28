export interface GetOrderCostSummaryOutput {
  id: string;
  orderNumber: string;
  customerId: string;
  salePrice: number;
  status: string;
  totalPrintCost: number;
  printJobCount: number;
  successfulPrintCount: number;
  failedPrintCount: number;
  margin: number;
}
