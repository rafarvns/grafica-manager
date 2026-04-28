import { describe, it, expect } from 'vitest';
import { Customer } from '@/domain/entities/Customer';

describe('Customer Entity', () => {
  it('should create a valid customer', () => {
    const customer = Customer.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
    });

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('John Doe');
    expect(customer.email).toBe('john@example.com');
  });
});
