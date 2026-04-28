export interface DeleteCustomerOutput {
  success: boolean;
  customerName: string;
  deletedAt: Date;
}

export interface RestoreCustomerOutput {
  id: string;
  name: string;
  email: string;
  deletedAt: null;
}

export interface GetCustomerOutput {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  orderSummary: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  };
}
