import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCustomerSummaryUseCase } from '@/application/use-cases/GetCustomerSummaryUseCase';

describe('GetCustomerSummaryUseCase', () => {
  let mockCustomerRepository: any;
  let mockOrderRepository: any;
  let mockPrintJobRepository: any;
  let useCase: GetCustomerSummaryUseCase;

  const mockCustomer = {
    id: 'customer-1',
    name: 'João Silva',
    email: 'joao@example.com',
    city: 'São Paulo',
  };

  const mockOrders = [
    {
      id: 'order-1',
      orderNumber: 'PED-001',
      salePrice: 100.0,
      status: 'completed',
    },
    {
      id: 'order-2',
      orderNumber: 'PED-002',
      salePrice: 150.0,
      status: 'in_production',
    },
    {
      id: 'order-3',
      orderNumber: 'PED-003',
      salePrice: 80.0,
      status: 'cancelled',
    },
  ];

  const mockPrintJobsByOrder = {
    'order-1': [
      { registeredCost: 25.0, status: 'sucesso' },
      { registeredCost: 20.0, status: 'sucesso' },
    ],
    'order-2': [
      { registeredCost: 40.0, status: 'sucesso' },
    ],
    'order-3': [
      { registeredCost: 0, status: 'erro' },
    ],
  };

  beforeEach(() => {
    mockCustomerRepository = {
      findById: vi.fn(),
    };
    mockOrderRepository = {
      findByCustomerId: vi.fn(),
    };
    mockPrintJobRepository = {
      findByOrderId: vi.fn(),
    };
    useCase = new GetCustomerSummaryUseCase(
      mockCustomerRepository,
      mockOrderRepository,
      mockPrintJobRepository
    );
  });

  describe('Validação de existência', () => {
    it('deve bloquear se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Cliente não encontrado'
      );
    });
  });

  describe('Resumo de pedidos', () => {
    it('deve listar todos os pedidos do cliente', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result.orders.length).toBe(3);
      expect(result.totalOrders).toBe(3);
    });

    it('deve contar pedidos por status', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result.ordersByStatus.completed).toBe(1);
      expect(result.ordersByStatus.in_production).toBe(1);
      expect(result.ordersByStatus.cancelled).toBe(1);
    });

    it('deve incluir custo total de cada pedido no resumo', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      const order1Summary = result.orders.find((o) => o.orderNumber === 'PED-001');
      expect(order1Summary?.totalPrintCost).toBe(45.0); // 25 + 20
    });
  });

  describe('Custo agregado', () => {
    it('deve somar todos os custos de impressão de todos os pedidos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      // 25 + 20 (order-1) + 40 (order-2) + 0 (order-3)
      expect(result.totalPrintCost).toBe(85.0);
    });

    it('deve somar preço de venda de todos os pedidos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      // 100 + 150 + 80
      expect(result.totalSaleValue).toBe(330.0);
    });

    it('deve calcular margem total (totalSaleValue - totalPrintCost)', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result.totalMargin).toBe(245.0); // 330 - 85
    });
  });

  describe('Contagem de impressões', () => {
    it('deve contar total de impressões registradas', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result.totalPrintJobs).toBe(4); // 2 + 1 + 1
    });

    it('deve contar impressões bem-sucedidas separadamente', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result.successfulPrintJobs).toBe(3); // 2 + 1
      expect(result.failedPrintJobs).toBe(1); // 1 com erro
    });
  });

  describe('Estrutura de resposta', () => {
    it('deve retornar informações do cliente', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue([]);
      mockPrintJobRepository.findByOrderId.mockResolvedValue([]);

      const result = await useCase.execute('customer-1');

      expect(result.customerId).toBe('customer-1');
      expect(result.customerName).toBe('João Silva');
      expect(result.customerEmail).toBe('joao@example.com');
    });

    it('deve retornar objeto completo com todos os campos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue(mockOrders);
      for (const order of mockOrders) {
        mockPrintJobRepository.findByOrderId.mockResolvedValueOnce(
          mockPrintJobsByOrder[order.id as keyof typeof mockPrintJobsByOrder] || []
        );
      }

      const result = await useCase.execute('customer-1');

      expect(result).toHaveProperty('customerId');
      expect(result).toHaveProperty('customerName');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('ordersByStatus');
      expect(result).toHaveProperty('totalSaleValue');
      expect(result).toHaveProperty('totalPrintCost');
      expect(result).toHaveProperty('totalMargin');
      expect(result).toHaveProperty('totalPrintJobs');
      expect(result).toHaveProperty('successfulPrintJobs');
      expect(result).toHaveProperty('failedPrintJobs');
    });
  });

  describe('Relatório sem pedidos', () => {
    it('deve retornar zeros se cliente não tem pedidos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.findByCustomerId.mockResolvedValue([]);

      const result = await useCase.execute('customer-1');

      expect(result.totalOrders).toBe(0);
      expect(result.totalSaleValue).toBe(0);
      expect(result.totalPrintCost).toBe(0);
      expect(result.totalMargin).toBe(0);
      expect(result.totalPrintJobs).toBe(0);
    });
  });
});
