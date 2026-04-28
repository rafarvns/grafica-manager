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
    const printJobs = [
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
    ];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute({});

    expect(result).toEqual(printJobs);
    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({});
  });

  it('deve filtrar por período (startDate)', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-20'),
    };

    const printJobs = [
      {
        id: 'job-1',
        documentName: 'design.pdf',
        status: 'sucesso',
        registeredCost: 5.00,
        createdAt: new Date('2026-04-25'),
      },
    ];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({
      startDate: new Date('2026-04-20'),
    });
    expect(result).toEqual(printJobs);
  });

  it('deve filtrar por período (startDate + endDate)', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
    };

    const printJobs = [];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
    });
    expect(result).toEqual([]);
  });

  it('deve filtrar por status', async () => {
    const input: ListPrintJobsInput = {
      status: 'sucesso',
    };

    const printJobs = [
      {
        id: 'job-1',
        status: 'sucesso',
        registeredCost: 5.00,
      },
      {
        id: 'job-2',
        status: 'sucesso',
        registeredCost: 10.00,
      },
    ];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({
      status: 'sucesso',
    });
    expect(result.every((job) => job.status === 'sucesso')).toBe(true);
  });

  it('deve filtrar por orderId', async () => {
    const input: ListPrintJobsInput = {
      orderId: 'order-001',
    };

    const printJobs = [
      {
        id: 'job-1',
        orderId: 'order-001',
        documentName: 'design.pdf',
      },
    ];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({
      orderId: 'order-001',
    });
    expect(result.every((job) => job.orderId === 'order-001')).toBe(true);
  });

  it('deve filtrar por múltiplos critérios simultaneamente', async () => {
    const input: ListPrintJobsInput = {
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: 'sucesso',
      orderId: 'order-001',
    };

    const printJobs = [
      {
        id: 'job-1',
        orderId: 'order-001',
        status: 'sucesso',
        createdAt: new Date('2026-04-15'),
        registeredCost: 5.00,
      },
    ];

    mockPrintJobRepository.findWithFilters.mockResolvedValue(printJobs);

    const result = await useCase.execute(input);

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: 'sucesso',
      orderId: 'order-001',
    });
    expect(result.length).toBe(1);
  });

  it('deve retornar lista vazia se nenhuma impressão corresponde ao filtro', async () => {
    const input: ListPrintJobsInput = {
      orderId: 'order-nonexistent',
    };

    mockPrintJobRepository.findWithFilters.mockResolvedValue([]);

    const result = await useCase.execute(input);

    expect(result).toEqual([]);
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
    const validStatuses = ['sucesso', 'erro', 'cancelada'];

    for (const status of validStatuses) {
      const input: ListPrintJobsInput = { status };

      mockPrintJobRepository.findWithFilters.mockResolvedValue([]);

      await useCase.execute(input);

      expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith({ status });
    }
  });

  it('deve rejeitar status inválido', async () => {
    const input: ListPrintJobsInput = {
      status: 'status-invalido',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Status inválido. Aceitos: sucesso, erro, cancelada'
    );
  });
});
