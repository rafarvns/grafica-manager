export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export interface CreateCustomerOutput {
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
}
