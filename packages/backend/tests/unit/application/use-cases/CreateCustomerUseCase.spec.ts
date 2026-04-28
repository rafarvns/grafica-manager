import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCustomerUseCase } from '@/application/use-cases/CreateCustomerUseCase';
import { CreateCustomerInput, CreateCustomerOutput } from '@/application/dtos/CreateCustomerDTO';

describe('CreateCustomerUseCase', () => {
  let mockRepository: any;
  let useCase: CreateCustomerUseCase;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    useCase = new CreateCustomerUseCase(mockRepository);
  });

  describe('Validação de entrada', () => {
    it('deve validar que nome é obrigatório', async () => {
      const input: CreateCustomerInput = {
        name: '',
        email: 'test@example.com',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Nome é obrigatório');
    });

    it('deve validar que email é obrigatório', async () => {
      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: '',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Email é obrigatório');
    });

    it('deve validar que email tem formato válido', async () => {
      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: 'invalid-email',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Email inválido');
    });

    it('deve trimmer espacos em branco do nome', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        deletedAt: null,
        createdAt: new Date(),
      });

      const input: CreateCustomerInput = {
        name: '  João Silva  ',
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
        })
      );
      expect(result.name).toBe('João Silva');
    });
  });

  describe('Validação de unicidade', () => {
    it('deve bloquear criação se email já existe', async () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 'existing-customer',
        email: 'joao@example.com',
      });

      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: 'joao@example.com',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Email já cadastrado');
    });

    it('deve permitir criação se email é único', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'new-customer-id',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        deletedAt: null,
        createdAt: new Date(),
      });

      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(result.id).toBe('new-customer-id');
      expect(result.email).toBe('joao@example.com');
    });
  });

  describe('Criação com campos opcionais', () => {
    it('deve criar cliente com apenas nome e email', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      const expectedCustomer = {
        id: 'customer-1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        deletedAt: null,
        createdAt: new Date(),
      };
      mockRepository.create.mockResolvedValue(expectedCustomer);

      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(result.name).toBe('João Silva');
      expect(result.email).toBe('joao@example.com');
      expect(result.phone).toBeNull();
    });

    it('deve criar cliente com todos os campos opcionais', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      const expectedCustomer = {
        id: 'customer-2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11987654321',
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        notes: 'Cliente VIP',
        deletedAt: null,
        createdAt: new Date(),
      };
      mockRepository.create.mockResolvedValue(expectedCustomer);

      const input: CreateCustomerInput = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11987654321',
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        notes: 'Cliente VIP',
      };

      const result = await useCase.execute(input);

      expect(result.phone).toBe('11987654321');
      expect(result.city).toBe('São Paulo');
      expect(result.notes).toBe('Cliente VIP');
    });
  });

  describe('Formato de resposta', () => {
    it('deve retornar customer com createdAt', async () => {
      const now = new Date();
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'customer-3',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        deletedAt: null,
        createdAt: now,
      });

      const input: CreateCustomerInput = {
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(result.createdAt).toEqual(now);
      expect(result.deletedAt).toBeNull();
    });
  });
});
