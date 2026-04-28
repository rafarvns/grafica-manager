import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateOrderUseCase } from '@/application/use-cases/CreateOrderUseCase';
import { CreateOrderInput } from '@/application/dtos/CreateOrderDTO';

describe('CreateOrderUseCase', () => {
  let mockCustomerRepository: any;
  let mockOrderRepository: any;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    mockCustomerRepository = {
      findById: vi.fn(),
    };
    mockOrderRepository = {
      create: vi.fn(),
    };
    useCase = new CreateOrderUseCase(mockCustomerRepository, mockOrderRepository);
  });

  describe('Validação de entrada', () => {
    it('deve validar que quantidade é maior que 0', async () => {
      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design brochura',
        quantity: 0,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Quantidade deve ser maior que 0');
    });

    it('deve validar que preço de venda é >= 0', async () => {
      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design brochura',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: -10.0,
        productionCost: 50.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Preço de venda não pode ser negativo');
    });

    it('deve validar que custo de produção é >= 0', async () => {
      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design brochura',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: -5.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Custo de produção não pode ser negativo');
    });

    it('deve validar que descrição é obrigatória', async () => {
      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: '',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Descrição é obrigatória');
    });
  });

  describe('Validação de cliente', () => {
    it('deve bloquear criação se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      const input: CreateOrderInput = {
        customerId: 'invalid-customer',
        description: 'Design brochura',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Cliente não encontrado');
    });

    it('deve permitir criação se cliente existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
        name: 'João Silva',
      });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        customerId: 'customer-1',
        description: 'Design brochura',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date('2026-05-01'),
        salePrice: 100.0,
        productionCost: 50.0,
        status: 'draft',
        createdAt: new Date(),
      });

      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design brochura',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date('2026-05-01'),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      const result = await useCase.execute(input);

      expect(result.id).toBe('order-1');
      expect(result.status).toBe('draft');
    });
  });

  describe('Criação com status padrão', () => {
    it('deve criar pedido com status "draft" por padrão', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
        name: 'João Silva',
      });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
        status: 'draft',
        createdAt: new Date(),
      });

      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      const result = await useCase.execute(input);

      expect(result.status).toBe('draft');
    });
  });

  describe('Número do pedido', () => {
    it('deve gerar número único do pedido', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
        status: 'draft',
        createdAt: new Date(),
      });

      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      const result = await useCase.execute(input);

      expect(result.orderNumber).toMatch(/^PED-\d+$/);
    });
  });

  describe('Campos opcionais', () => {
    it('deve criar pedido com apenas campos obrigatórios', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
        notes: null,
        status: 'draft',
        createdAt: new Date(),
      });

      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
      };

      const result = await useCase.execute(input);

      expect(result.notes).toBeNull();
    });

    it('deve criar pedido com notas opcionais', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
        notes: 'Expedição urgente',
        status: 'draft',
        createdAt: new Date(),
      });

      const input: CreateOrderInput = {
        customerId: 'customer-1',
        description: 'Design',
        quantity: 100,
        paperTypeId: 'paper-1',
        width: 210,
        height: 297,
        dueDate: new Date(),
        salePrice: 100.0,
        productionCost: 50.0,
        notes: 'Expedição urgente',
      };

      const result = await useCase.execute(input);

      expect(result.notes).toBe('Expedição urgente');
    });
  });
});
