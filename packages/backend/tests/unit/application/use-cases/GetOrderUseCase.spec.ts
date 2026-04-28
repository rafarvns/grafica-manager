import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetOrderUseCase } from '@/application/use-cases/GetOrderUseCase';
import { Order } from '@/domain/entities/Order';

describe('GetOrderUseCase', () => {
  let mockOrderRepository: any;
  let useCase: GetOrderUseCase;

  const mockOrder = Order.create({
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
    status: 'in_production',
  });

  const mockHistory = [
    {
      fromStatus: 'draft',
      toStatus: 'scheduled',
      createdAt: new Date('2026-04-25T10:00:00Z'),
    },
    {
      fromStatus: 'scheduled',
      toStatus: 'in_production',
      createdAt: new Date('2026-04-26T14:00:00Z'),
    },
  ];

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      findStatusHistory: vi.fn(),
    };
    useCase = new GetOrderUseCase(mockOrderRepository);
  });

  describe('Busca de pedido', () => {
    it('deve retornar pedido se encontrado', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.id).toBe(mockOrder.id);
      expect(result.orderNumber).toBe('PED-001');
      expect(result.customerId).toBe('customer-1');
    });

    it('deve bloquear busca se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Pedido não encontrado'
      );
    });

    it('deve incluir todos os campos do pedido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.description).toBe('Design brochura');
      expect(result.quantity).toBe(100);
      expect(result.paperTypeId).toBe('paper-1');
      expect(result.width).toBe(210);
      expect(result.height).toBe(297);
      expect(result.salePrice).toBe(100.0);
      expect(result.productionCost).toBe(50.0);
      expect(result.status).toBe('in_production');
    });
  });

  describe('Histórico de status', () => {
    it('deve incluir histórico de mudanças de status', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.statusHistory).toBeDefined();
      expect(result.statusHistory.length).toBe(2);
    });

    it('deve retornar histórico vazio para pedido novo', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(mockOrder.id);

      expect(result.statusHistory).toEqual([]);
    });

    it('deve incluir transições com timestamps', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.statusHistory[0]).toHaveProperty('fromStatus');
      expect(result.statusHistory[0]).toHaveProperty('toStatus');
      expect(result.statusHistory[0]).toHaveProperty('createdAt');
    });

    it('deve ordenar histórico cronologicamente', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      const firstTime = result.statusHistory[0].createdAt.getTime();
      const secondTime = result.statusHistory[1].createdAt.getTime();

      expect(firstTime).toBeLessThanOrEqual(secondTime);
    });

    it('deve incluir razão de cancelamento se pedido foi cancelado', async () => {
      const cancelledOrder = Order.create({
        ...mockOrder.toJSON(),
        status: 'cancelled',
      });
      
      mockOrderRepository.findById.mockResolvedValue(cancelledOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue([
        ...mockHistory,
        { fromStatus: 'in_production', toStatus: 'cancelled', reason: 'Cliente cancelou', createdAt: new Date() }
      ]);

      const result = await useCase.execute(cancelledOrder.id);

      expect(result.status).toBe('cancelled');
      expect(result.statusHistory.some(h => h.reason === 'Cliente cancelou')).toBe(true);
    });
  });

  describe('Dados do pedido', () => {
    it('deve retornar datas como Date objects', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.dueDate).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('deve retornar campo notas se existir', async () => {
      const orderWithNotes = Order.create({
        ...mockOrder.toJSON(),
        notes: 'Expedição urgente',
      });
      mockOrderRepository.findById.mockResolvedValue(orderWithNotes);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(orderWithNotes.id);

      expect(result.notes).toBe('Expedição urgente');
    });

    it('deve retornar notas como undefined ou null se não existir', async () => {
      const orderWithoutNotes = Order.create({
        ...mockOrder.toJSON(),
        notes: null,
      });
      mockOrderRepository.findById.mockResolvedValue(orderWithoutNotes);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(orderWithoutNotes.id);

      expect(result.notes === null || result.notes === undefined).toBe(true);
    });
  });

  describe('Detalhes do cliente', () => {
    it('deve retornar ID do cliente', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result.customerId).toBe('customer-1');
    });
  });

  describe('Estrutura da resposta', () => {
    it('deve retornar objeto com todos os campos esperados', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.findStatusHistory.mockResolvedValue(mockHistory);

      const result = await useCase.execute(mockOrder.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderNumber');
      expect(result).toHaveProperty('customerId');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('paperTypeId');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('dueDate');
      expect(result).toHaveProperty('salePrice');
      expect(result).toHaveProperty('productionCost');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('statusHistory');
      expect(result).toHaveProperty('createdAt');
    });
  });
});
