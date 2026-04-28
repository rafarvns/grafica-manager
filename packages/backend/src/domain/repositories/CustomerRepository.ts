import { Customer } from '@/domain/entities/Customer';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByExternalId(externalId: string): Promise<Customer | null>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  findAll(filters?: any): Promise<Customer[]>;
  softDelete(id: string): Promise<void>;
}
