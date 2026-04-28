import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListPrintJobsUseCase } from '@/application/use-cases/ListPrintJobsUseCase';
import { ListPrintJobsInput } from '@/application/dtos/ListPrintJobsDTO';

const mockPrintJobRepository = {
  findWithFilters: vi.fn(),
};

describe('ListPrintJobsUseCase', () => {
  let useCase: ListPrintJobsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListPrintJobsUseCase(mockPrintJobRepository);
  });

  it('deve listar todas as impressões', async () => {
    const paginatedResult = {
      data: [
        {
          id: 'job-1',
          documentName: 'design1.pdf',
          paperTypeId: 'paper-123',
          quality: 'normal',
          colorMode: 'CMYK',
          dpi: 300,
          pageCount: 10,
          status: 'sucesso',
          registeredCost: 5.00,
          orderId: 'order-001',
          createdAt: new Date('2026-04-25'),
        },
        {
          id: 'job-2',
          documentName: 'design2.pdf',
          paperTypeId: 'paper-456',
          quality: 'alta',
          colorMode: 'RGB',
          dpi: 600,
          pageCount: 20,
          status: 'sucesso',
          registeredCost: 20.00,
          orderId: 'order-002',
          createdAt: new Date('2026-04-26'),
        },
      ],
      total: 2,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 25 })
    );
  });

  it('deve filtrar por período (startDate)', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-20'),
    };

    const paginatedResult = {
      data: [
        {
          id: 'job-1',
          documentName: 'design.pdf',
          status: 'sucesso',
          registeredCost: 5.00,
          createdAt: new Date('2026-04-25'),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: new Date('2026-04-20') })
    );
    expect(result.data).toHaveLength(1);
  });

  it('deve filtrar por período (startDate + endDate)', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
    };

    const paginatedResult = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
      })
    );
    expect(result.data).toHaveLength(0);
  });

  it('deve filtrar por status', async () => {
    const input: ListPrintJobsInput = {
      status: 'sucesso',
    };

    const paginatedResult = {
      data: [
        { id: 'job-1', status: 'sucesso', registeredCost: 5.00 },
        { id: 'job-2', status: 'sucesso', registeredCost: 10.00 },
      ],
      total: 2,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sucesso' })
    );
    expect(result.data.every((job) => job.status === 'sucesso')).toBe(true);
  });

  it('deve filtrar por orderId', async () => {
    const input: ListPrintJobsInput = {
      orderId: 'order-001',
    };

    const paginatedResult = {
      data: [
        { id: 'job-1', orderId: 'order-001', documentName: 'design.pdf' },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-001' })
    );
    expect(result.data.every((job) => job.orderId === 'order-001')).toBe(true);
  });

  it('deve filtrar por múltiplos critérios simultaneamente', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: 'sucesso',
      orderId: 'order-001',
    };

    const paginatedResult = {
      data: [
        {
          id: 'job-1',
          orderId: 'order-001',
          status: 'sucesso',
          createdAt: new Date('2026-04-15'),
          registeredCost: 5.00,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
        status: 'sucesso',
        orderId: 'order-001',
      })
    );
    expect(result.data.length).toBe(1);
  });

  it('deve retornar lista vazia se nenhuma impressão corresponde ao filtro', async () => {
    const input: ListPrintJobsInput = {
      orderId: 'order-nonexistent',
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 25,
    });

    const result = await useCase.execute(input);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('deve validar período (startDate <= endDate)', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-30'),
      endDate: new Date('2026-04-01'),
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'startDate não pode ser posterior a endDate'
    );
  });

  it('deve suportar status válidos', async () => {
    const validStatuses = ['sucesso', 'erro', 'cancelada', 'pendente'];

    for (const status of validStatuses) {
      const input: ListPrintJobsInput = { status };

      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute(input);

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status })
      );
    }
  });

  it('deve rejeitar status inválido', async () => {
    const input: ListPrintJobsInput = {
      status: 'status-invalido',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Status inválido. Aceitos: sucesso, erro, cancelada, pendente'
    );
  });

  // ─── Novos testes: paginação, sorting, filtros adicionais ───

  describe('Paginação', () => {
    it('deve retornar resultado paginado com data, total, page, pageSize', async () => {
      const paginatedResult = {
        data: [
          { id: 'job-1', documentName: 'design1.pdf', status: 'sucesso', registeredCost: 5.0 },
          { id: 'job-2', documentName: 'design2.pdf', status: 'sucesso', registeredCost: 10.0 },
        ],
        total: 47,
        page: 1,
        pageSize: 25,
      };

      mockPrintJobRepository.findWithFilters.mockResolvedValue(paginatedResult);

      const result = await useCase.execute({ page: 1, pageSize: 25 });

      expect(result).toEqual(paginatedResult);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(47);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
    });

    it('deve usar valores padrão de paginação (page=1, pageSize=25)', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({});

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 25 })
      );
    });

    it('deve rejeitar pageSize maior que 100', async () => {
      await expect(useCase.execute({ page: 1, pageSize: 200 })).rejects.toThrow(
        'pageSize deve ser entre 1 e 100'
      );
    });

    it('deve rejeitar page menor que 1', async () => {
      await expect(useCase.execute({ page: 0, pageSize: 25 })).rejects.toThrow(
        'page deve ser maior ou igual a 1'
      );
    });
  });

  describe('Sorting', () => {
    it('deve aceitar sortBy=date com sortOrder=desc', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ sortBy: 'date', sortOrder: 'desc' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'date', sortOrder: 'desc' })
      );
    });

    it('deve aceitar sortBy=cost com sortOrder=asc', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ sortBy: 'cost', sortOrder: 'asc' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'cost', sortOrder: 'asc' })
      );
    });

    it('deve aceitar sortBy=status e sortBy=customer', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ sortBy: 'status' });
      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'status' })
      );

      await useCase.execute({ sortBy: 'customer' });
      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'customer' })
      );
    });

    it('deve rejeitar sortBy inválido', async () => {
      await expect(useCase.execute({ sortBy: 'invalido' })).rejects.toThrow(
        'sortBy inválido. Aceitos: date, cost, status, customer'
      );
    });

    it('deve rejeitar sortOrder inválido', async () => {
      await expect(useCase.execute({ sortOrder: 'lateral' })).rejects.toThrow(
        'sortOrder inválido. Aceitos: asc, desc'
      );
    });

    it('deve usar sortOrder=desc como padrão quando sortBy é fornecido sem sortOrder', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ sortBy: 'date' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'date', sortOrder: 'desc' })
      );
    });
  });

  describe('Filtros adicionais', () => {
    it('deve filtrar por customerId', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ customerId: 'cust-001' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-001' })
      );
    });

    it('deve filtrar por origin (SHOPEE)', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ origin: 'SHOPEE' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ origin: 'SHOPEE' })
      );
    });

    it('deve filtrar por origin (MANUAL)', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      await useCase.execute({ origin: 'MANUAL' });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ origin: 'MANUAL' })
      );
    });

    it('deve rejeitar origin inválido', async () => {
      await expect(useCase.execute({ origin: 'INVALID' })).rejects.toThrow(
        'origin inválido. Aceitos: SHOPEE, MANUAL'
      );
    });
  });

  describe('Validação de range de período', () => {
    it('deve rejeitar período maior que 1 ano', async () => {
      const input: ListPrintJobsInput = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-06-01'),
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Período não pode exceder 1 ano'
      );
    });

    it('deve aceitar período de exatamente 1 ano', async () => {
      mockPrintJobRepository.findWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });

      const startDate = new Date('2025-04-01');
      const endDate = new Date('2026-04-01');

      await useCase.execute({ startDate, endDate });

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalled();
    });
  });
});
