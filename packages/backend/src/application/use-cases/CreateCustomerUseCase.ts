import { CreateCustomerInput, CreateCustomerOutput } from '@/application/dtos/CreateCustomerDTO';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ICustomerRepository {
  findByEmail(email: string): Promise<any>;
  create(data: any): Promise<CreateCustomerOutput>;
}

export class CreateCustomerUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    // Validar nome obrigatório
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }

    // Validar email obrigatório
    if (!input.email || input.email.trim().length === 0) {
      throw new Error('Email é obrigatório');
    }

    // Validar formato de email
    if (!EMAIL_REGEX.test(input.email.trim())) {
      throw new Error('Email inválido');
    }

    // Verificar email duplicado
    const existingCustomer = await this.customerRepository.findByEmail(
      input.email.trim()
    );
    if (existingCustomer) {
      throw new Error('Email já cadastrado');
    }

    // Criar cliente com nome trimado
    const customer = await this.customerRepository.create({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      zipCode: input.zipCode || null,
      notes: input.notes || null,
    });

    return customer;
  }
}
