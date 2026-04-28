import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateCustomerUseCase } from '@/application/use-cases/UpdateCustomerUseCase';
import { UpdateCustomerInput } from '@/application/dtos/UpdateCustomerDTO';

describe('UpdateCustomerUseCase', () => {
  let mockRepository: any;
  let useCase: UpdateCustomerUseCase;

  const existingCustomer = {
    id: 'customer-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11987654321',
    address: 'Rua A, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    notes: null,
    deletedAt: null,
    createdAt: new Date('2026-04-20'),
  };

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
    };
    useCase = new UpdateCustomerUseCase(mockRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear atualização se cliente não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const input: UpdateCustomerInput = {
        id: 'non-existent',
        name: 'New Name',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Cliente não encontrado');
    });

    it('deve permitir atualização se cliente existe', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...existingCustomer,
        name: 'João Silva Atualizado',
      });

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        name: 'João Silva Atualizado',
      };

      const result = await useCase.execute(input);

      expect(result.name).toBe('João Silva Atualizado');
    });
  });

  describe('Validação de email', () => {
    it('deve validar formato de email se fornecido', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        email: 'invalid-email',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Email inválido');
    });

    it('deve bloquear email duplicado', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.findByEmail.mockResolvedValue({
        id: 'customer-2',
        email: 'novo@example.com',
      });

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        email: 'novo@example.com',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Email já cadastrado');
    });

    it('deve permitir email próprio do cliente', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.findByEmail.mockResolvedValue(existingCustomer);
      mockRepository.update.mockResolvedValue(existingCustomer);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(result.email).toBe('joao@example.com');
    });
  });

  describe('Atualização parcial', () => {
    it('deve atualizar apenas nome', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      const updated = { ...existingCustomer, name: 'Novo Nome' };
      mockRepository.update.mockResolvedValue(updated);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        name: 'Novo Nome',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.update).toHaveBeenCalledWith('customer-1', {
        name: 'Novo Nome',
      });
      expect(result.name).toBe('Novo Nome');
    });

    it('deve atualizar múltiplos campos', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.findByEmail.mockResolvedValue(null);
      const updated = {
        ...existingCustomer,
        phone: '21999999999',
        city: 'Rio de Janeiro',
      };
      mockRepository.update.mockResolvedValue(updated);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        phone: '21999999999',
        city: 'Rio de Janeiro',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.update).toHaveBeenCalledWith('customer-1', {
        phone: '21999999999',
        city: 'Rio de Janeiro',
      });
      expect(result.phone).toBe('21999999999');
      expect(result.city).toBe('Rio de Janeiro');
    });

    it('deve limpar campo opcional se passado como null', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      const updated = { ...existingCustomer, notes: null };
      mockRepository.update.mockResolvedValue(updated);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        notes: null,
      };

      const result = await useCase.execute(input);

      expect(mockRepository.update).toHaveBeenCalledWith('customer-1', {
        notes: null,
      });
    });
  });

  describe('Trimming de valores', () => {
    it('deve trimmar nome ao atualizar', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      const updated = { ...existingCustomer, name: 'Novo Nome' };
      mockRepository.update.mockResolvedValue(updated);

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        name: '  Novo Nome  ',
      };

      await useCase.execute(input);

      expect(mockRepository.update).toHaveBeenCalledWith('customer-1', {
        name: 'Novo Nome',
      });
    });
  });

  describe('Preservação de campos não alterados', () => {
    it('deve preservar campos não fornecidos na atualização', async () => {
      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.update.mockResolvedValue({
        ...existingCustomer,
        phone: '21999999999',
      });

      const input: UpdateCustomerInput = {
        id: 'customer-1',
        phone: '21999999999',
      };

      const result = await useCase.execute(input);

      expect(result.name).toBe(existingCustomer.name);
      expect(result.email).toBe(existingCustomer.email);
      expect(result.phone).toBe('21999999999');
    });
  });
});
