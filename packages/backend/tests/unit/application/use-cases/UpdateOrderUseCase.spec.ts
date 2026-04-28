import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateOrderUseCase } from '@/application/use-cases/UpdateOrderUseCase';
import { UpdateOrderInput } from '@/application/dtos/UpdateOrderDTO';
import { Order } from '@/domain/entities/Order';

describe('UpdateOrderUseCase', () => {
  let mockOrderRepository: any;
  let useCase: UpdateOrderUseCase;

  const createMockOrder = (status: any = 'draft') => Order.create({
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    description: 'Design original',
    quantity: 100,
    paperTypeId: 'paper-1',
    width: 210,
    height: 297,
    dueDate: new Date('2026-05-01'),
    salePrice: 100.0,
    productionCost: 50.0,
    status,
  });

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      update: vi.fn(),
      findStatusHistory: vi.fn(),
    };
    useCase = new UpdateOrderUseCase(mockOrderRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear atualização se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      await expect(useCase.execute('non-existent', input)).rejects.toThrow(
        'Pedido não encontrado'
      );
    });
  });

  describe('Bloqueio de edição em shipping', () => {
    it('deve bloquear qualquer edição se status é shipping', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('shipping'));

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Pedido em shipping não pode ser editado'
      );
    });

    it('deve permitir edição se status não é shipping', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        description: 'Nova descrição',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute(order.id, input);

      expect(result.description).toBe('Nova descrição');
    });
  });

  describe('Bloqueio de edição em cancelado', () => {
    it('deve bloquear edição se status é cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('cancelled'));

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Pedido cancelado não pode ser editado'
      );
    });
  });

  describe('Validação de campos', () => {
    it('deve validar quantidade > 0 se fornecida', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder());

      const input: UpdateOrderInput = {
        quantity: 0,
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Quantidade deve ser maior que 0'
      );
    });

    it('deve validar preço de venda >= 0 se fornecido', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder());

      const input: UpdateOrderInput = {
        salePrice: -10.0,
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Preço de venda não pode ser negativo'
      );
    });

    it('deve validar custo >= 0 se fornecido', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder());

      const input: UpdateOrderInput = {
        productionCost: -5.0,
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Custo de produção não pode ser negativo'
      );
    });
  });

  describe('Atualização parcial', () => {
    it('deve permitir atualizar apenas descrição', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        description: 'Nova descrição',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute(order.id, input);

      expect(result.description).toBe('Nova descrição');
      expect(result.quantity).toBe(100);
    });

    it('deve permitir atualizar múltiplos campos', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        description: 'Nova descrição',
        quantity: 200,
        salePrice: 150.0,
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
        quantity: 200,
        salePrice: 150.0,
      };

      const result = await useCase.execute(order.id, input);

      expect(result.description).toBe('Nova descrição');
      expect(result.quantity).toBe(200);
      expect(result.salePrice).toBe(150.0);
    });

    it('deve permitir atualizar data limite', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      const newDueDate = new Date('2026-06-01');
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        dueDate: newDueDate,
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        dueDate: newDueDate,
      };

      const result = await useCase.execute(order.id, input);

      expect(result.dueDate.getTime()).toEqual(newDueDate.getTime());
    });

    it('deve permitir atualizar notas', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        notes: 'Nova nota importante',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        notes: 'Nova nota importante',
      };

      const result = await useCase.execute(order.id, input);

      expect(result.notes).toBe('Nova nota importante');
    });

    it('deve permitir limpar notas', async () => {
      const order = Order.create({ ...createMockOrder().toJSON(), notes: 'Nota anterior' });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        notes: null,
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        notes: null,
      };

      const result = await useCase.execute(order.id, input);

      expect(result.notes === null || result.notes === undefined).toBe(true);
    });
  });

  describe('Preservação de campos', () => {
    it('deve preservar campos não atualizados', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(Order.create({
        ...order.toJSON(),
        description: 'Nova descrição',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute(order.id, input);

      expect(result.quantity).toBe(order.quantity);
      expect(result.salePrice).toBe(order.salePrice);
      expect(result.productionCost).toBe(order.productionCost);
    });
  });

  describe('Estados permitidos para edição', () => {
    const editableStatuses = ['draft', 'scheduled', 'in_production', 'completed'];

    it('deve permitir edição em todos os estados editáveis', async () => {
      for (const status of editableStatuses) {
        const order = createMockOrder(status);
        mockOrderRepository.findById.mockResolvedValue(order);
        mockOrderRepository.update.mockResolvedValue(Order.create({
          ...order.toJSON(),
          description: 'Nova descrição',
        }));
        mockOrderRepository.findStatusHistory.mockResolvedValue([]);

        const input: UpdateOrderInput = {
          description: 'Nova descrição',
        };

        const result = await useCase.execute(order.id, input);

        expect(result.description).toBe('Nova descrição');
      }
    });
  });
});
