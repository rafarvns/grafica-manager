export interface ListCustomersInput {
  page?: number;
  pageSize?: number;
  name?: string;
  email?: string;
  city?: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
}

export interface ListCustomersOutput {
  data: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}
