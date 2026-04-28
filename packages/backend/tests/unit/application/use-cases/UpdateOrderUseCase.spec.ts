import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateOrderUseCase } from '@/application/use-cases/UpdateOrderUseCase';
import { UpdateOrderInput } from '@/application/dtos/UpdateOrderDTO';

describe('UpdateOrderUseCase', () => {
  let mockOrderRepository: any;
  let useCase: UpdateOrderUseCase;

  const mockOrder = {
    id: 'order-1',
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
    status: 'draft',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      update: vi.fn(),
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
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'shipping',
      });

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Pedido em shipping não pode ser editado'
      );
    });

    it('deve permitir edição se status não é shipping', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        description: 'Nova descrição',
      });

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute('order-1', input);

      expect(result.description).toBe('Nova descrição');
    });
  });

  describe('Bloqueio de edição em cancelado', () => {
    it('deve bloquear edição se status é cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
      });

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
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const input: UpdateOrderInput = {
        quantity: 0,
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Quantidade deve ser maior que 0'
      );
    });

    it('deve validar preço de venda >= 0 se fornecido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const input: UpdateOrderInput = {
        salePrice: -10.0,
      };

      await expect(useCase.execute('order-1', input)).rejects.toThrow(
        'Preço de venda não pode ser negativo'
      );
    });

    it('deve validar custo >= 0 se fornecido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

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
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        description: 'Nova descrição',
      });

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute('order-1', input);

      expect(result.description).toBe('Nova descrição');
      expect(result.quantity).toBe(100);
    });

    it('deve permitir atualizar múltiplos campos', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        description: 'Nova descrição',
        quantity: 200,
        salePrice: 150.0,
      });

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
        quantity: 200,
        salePrice: 150.0,
      };

      const result = await useCase.execute('order-1', input);

      expect(result.description).toBe('Nova descrição');
      expect(result.quantity).toBe(200);
      expect(result.salePrice).toBe(150.0);
    });

    it('deve permitir atualizar data limite', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      const newDueDate = new Date('2026-06-01');
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        dueDate: newDueDate,
      });

      const input: UpdateOrderInput = {
        dueDate: newDueDate,
      };

      const result = await useCase.execute('order-1', input);

      expect(result.dueDate).toEqual(newDueDate);
    });

    it('deve permitir atualizar notas', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        notes: 'Nova nota importante',
      });

      const input: UpdateOrderInput = {
        notes: 'Nova nota importante',
      };

      const result = await useCase.execute('order-1', input);

      expect(result.notes).toBe('Nova nota importante');
    });

    it('deve permitir limpar notas', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        notes: 'Nota anterior',
      });
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        notes: null,
      });

      const input: UpdateOrderInput = {
        notes: null,
      };

      const result = await useCase.execute('order-1', input);

      expect(result.notes).toBeNull();
    });
  });

  describe('Preservação de campos', () => {
    it('deve preservar campos não atualizados', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.update.mockResolvedValue({
        ...mockOrder,
        description: 'Nova descrição',
      });

      const input: UpdateOrderInput = {
        description: 'Nova descrição',
      };

      const result = await useCase.execute('order-1', input);

      expect(result.quantity).toBe(mockOrder.quantity);
      expect(result.salePrice).toBe(mockOrder.salePrice);
      expect(result.productionCost).toBe(mockOrder.productionCost);
    });
  });

  describe('Estados permitidos para edição', () => {
    const editableStatuses = ['draft', 'scheduled', 'in_production', 'completed'];

    it('deve permitir edição em todos os estados editáveis', async () => {
      for (const status of editableStatuses) {
        mockOrderRepository.findById.mockResolvedValue({
          ...mockOrder,
          status,
        });
        mockOrderRepository.update.mockResolvedValue({
          ...mockOrder,
          status,
          description: 'Nova descrição',
        });

        const input: UpdateOrderInput = {
          description: 'Nova descrição',
        };

        const result = await useCase.execute('order-1', input);

        expect(result.description).toBe('Nova descrição');
      }
    });
  });
});
