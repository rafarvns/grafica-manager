import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetOrderCostSummaryUseCase } from '@/application/use-cases/GetOrderCostSummaryUseCase';

describe('GetOrderCostSummaryUseCase', () => {
  let mockOrderRepository: any;
  let mockPrintJobRepository: any;
  let useCase: GetOrderCostSummaryUseCase;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    description: 'Design brochura',
    salePrice: 100.0,
    status: 'in_production',
    createdAt: new Date(),
  };

  const mockPrintJobs = [
    {
      id: 'job-1',
      documentName: 'design1.pdf',
      registeredCost: 25.5,
      status: 'sucesso',
      createdAt: new Date('2026-04-25'),
    },
    {
      id: 'job-2',
      documentName: 'design2.pdf',
      registeredCost: 30.0,
      status: 'sucesso',
      createdAt: new Date('2026-04-26'),
    },
    {
      id: 'job-3',
      documentName: 'design3.pdf',
      registeredCost: 0, // erro na impressão
      status: 'erro',
      createdAt: new Date('2026-04-27'),
    },
  ];

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
    };
    mockPrintJobRepository = {
      findByOrderId: vi.fn(),
    };
    useCase = new GetOrderCostSummaryUseCase(mockOrderRepository, mockPrintJobRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Pedido não encontrado'
      );
    });
  });

  describe('Cálculo de custo total', () => {
    it('deve somar todos os custos de impressão (snapshots imutáveis)', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.totalPrintCost).toBe(55.5); // 25.5 + 30.0 + 0
    });

    it('deve retornar 0 se não há impressões', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue([]);

      const result = await useCase.execute('order-1');

      expect(result.totalPrintCost).toBe(0);
    });

    it('deve incluir impressões com erro (custo = 0)', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.printJobCount).toBe(3); // inclui a com erro
      expect(result.totalPrintCost).toBe(55.5); // 25.5 + 30.0 + 0
    });

    it('deve não recalcular — apenas somar snapshots históricos', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      // Verifica que é a soma dos snapshots exatos, não um cálculo
      expect(result.totalPrintCost).toBe(55.5);
      expect(mockPrintJobRepository.findByOrderId).toHaveBeenCalledWith('order-1');
    });
  });

  describe('Resumo do pedido', () => {
    it('deve retornar informações completas do pedido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.id).toBe('order-1');
      expect(result.orderNumber).toBe('PED-001');
      expect(result.salePrice).toBe(100.0);
      expect(result.status).toBe('in_production');
    });

    it('deve calcular margem (salePrice - totalPrintCost)', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        salePrice: 100.0,
      });
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.margin).toBe(44.5); // 100.0 - 55.5
    });

    it('deve retornar margem negativa se custo > preço', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        salePrice: 50.0,
      });
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.margin).toBe(-5.5); // 50.0 - 55.5
    });
  });

  describe('Contagem de impressões', () => {
    it('deve contar total de impressões', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.printJobCount).toBe(3);
    });

    it('deve contar impressões bem-sucedidas separadamente', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result.successfulPrintCount).toBe(2);
      expect(result.failedPrintCount).toBe(1);
    });
  });

  describe('Estrutura de resposta', () => {
    it('deve retornar objeto com todos os campos', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPrintJobRepository.findByOrderId.mockResolvedValue(mockPrintJobs);

      const result = await useCase.execute('order-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderNumber');
      expect(result).toHaveProperty('customerId');
      expect(result).toHaveProperty('salePrice');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('totalPrintCost');
      expect(result).toHaveProperty('printJobCount');
      expect(result).toHaveProperty('successfulPrintCount');
      expect(result).toHaveProperty('failedPrintCount');
      expect(result).toHaveProperty('margin');
    });
  });
});
