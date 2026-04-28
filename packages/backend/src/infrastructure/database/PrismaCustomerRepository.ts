import { PrismaClient } from '@prisma/client';
import { CustomerRepository } from '@/domain/repositories/CustomerRepository';
import { Customer } from '@/domain/entities/Customer';

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) return null;
    return this.mapToDomain(customer);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) return null;
    return this.mapToDomain(customer);
  }

  async findByExternalId(externalId: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { externalId },
    });

    if (!customer) return null;
    return this.mapToDomain(customer);
  }

  async create(customer: Customer): Promise<Customer> {
    const data = customer.toJSON();
    const created = await this.prisma.customer.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        notes: data.notes ?? null,
        externalId: data.externalId ?? null,
        storeId: data.storeId ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToDomain(created);
  }

  async update(customer: Customer): Promise<Customer> {
    const data = customer.toJSON();
    const updated = await this.prisma.customer.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      },
    });

    return this.mapToDomain(updated);
  }

  async findAll(filters?: any): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...filters,
      },
      orderBy: { name: 'asc' },
    });

    return customers.map(this.mapToDomain);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToDomain(customer: any): Customer {
    return new Customer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      notes: customer.notes,
      externalId: customer.externalId,
      storeId: customer.storeId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
    });
  }
}
