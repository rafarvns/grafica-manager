import {
  UpdateCustomerInput,
  UpdateCustomerOutput,
} from '@/application/dtos/UpdateCustomerDTO';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  update(id: string, data: any): Promise<UpdateCustomerOutput>;
}

export class UpdateCustomerUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<UpdateCustomerOutput> {
    // Verificar se cliente existe
    const existingCustomer = await this.customerRepository.findById(input.id);
    if (!existingCustomer) {
      throw new Error('Cliente não encontrado');
    }

    const updateData: any = {};

    // Validar e adicionar nome se fornecido
    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }

    // Validar e adicionar email se fornecido
    if (input.email !== undefined) {
      const emailTrimmed = input.email.trim();

      // Validar formato
      if (!EMAIL_REGEX.test(emailTrimmed)) {
        throw new Error('Email inválido');
      }

      // Verificar se email não é duplicado (a menos que seja o email do próprio cliente)
      if (emailTrimmed !== existingCustomer.email) {
        const duplicateCustomer = await this.customerRepository.findByEmail(
          emailTrimmed
        );
        if (duplicateCustomer) {
          throw new Error('Email já cadastrado');
        }
      }

      updateData.email = emailTrimmed;
    }

    // Adicionar outros campos opcionais se fornecidos
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    if (input.city !== undefined) {
      updateData.city = input.city;
    }

    if (input.state !== undefined) {
      updateData.state = input.state;
    }

    if (input.zipCode !== undefined) {
      updateData.zipCode = input.zipCode;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Atualizar cliente
    const updatedCustomer = await this.customerRepository.update(
      input.id,
      updateData
    );

    return updatedCustomer;
  }
}
