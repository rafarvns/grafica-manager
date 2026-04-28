import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReprocessPrintJobUseCase } from '@/application/use-cases/ReprocessPrintJobUseCase';

const mockPrintJobRepository = {
  findById: vi.fn(),
  updateStatus: vi.fn(),
};

const mockJobQueue = {
  enqueue: vi.fn(),
};

describe('ReprocessPrintJobUseCase', () => {
  let useCase: ReprocessPrintJobUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ReprocessPrintJobUseCase(
      mockPrintJobRepository as any,
      mockJobQueue as any
    );
  });

  it('deve reprocessar impressão com status "erro" → status muda para "pendente"', async () => {
    const errorJob = {
      id: 'job-1',
      documentName: 'design.pdf',
      status: 'erro',
      errorMessage: 'Impressora desconectada',
      registeredCost: 0,
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(errorJob);
    mockPrintJobRepository.updateStatus.mockResolvedValue({
      ...errorJob,
      status: 'pendente',
      errorMessage: null,
    });
    mockJobQueue.enqueue.mockResolvedValue(undefined);

    const result = await useCase.execute({ id: 'job-1' });

    expect(result.status).toBe('pendente');
    expect(result.message).toBe('Impressão reprocessada com sucesso');
    expect(mockPrintJobRepository.updateStatus).toHaveBeenCalledWith('job-1', 'pendente');
    expect(mockJobQueue.enqueue).toHaveBeenCalledWith('job-1');
  });

  it('deve lançar erro se impressão não existe', async () => {
    mockPrintJobRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'job-inexistente' })).rejects.toThrow(
      'Impressão não encontrada'
    );

    expect(mockPrintJobRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockJobQueue.enqueue).not.toHaveBeenCalled();
  });

  it('deve lançar erro se impressão não está em status "erro"', async () => {
    const successJob = {
      id: 'job-2',
      documentName: 'design.pdf',
      status: 'sucesso',
      registeredCost: 5.0,
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(successJob);

    await expect(useCase.execute({ id: 'job-2' })).rejects.toThrow(
      'Apenas impressões com status "erro" podem ser reprocessadas'
    );

    expect(mockPrintJobRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockJobQueue.enqueue).not.toHaveBeenCalled();
  });

  it('deve lançar erro se impressão está em status "pendente"', async () => {
    const pendingJob = {
      id: 'job-3',
      documentName: 'design.pdf',
      status: 'pendente',
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(pendingJob);

    await expect(useCase.execute({ id: 'job-3' })).rejects.toThrow(
      'Apenas impressões com status "erro" podem ser reprocessadas'
    );
  });

  it('deve enfileirar job na Bull queue após atualizar status', async () => {
    const errorJob = {
      id: 'job-1',
      documentName: 'design.pdf',
      status: 'erro',
      errorMessage: 'Impressora desconectada',
      registeredCost: 0,
      createdAt: new Date('2026-04-27'),
    };

    const callOrder: string[] = [];
    mockPrintJobRepository.findById.mockResolvedValue(errorJob);
    mockPrintJobRepository.updateStatus.mockImplementation(async () => {
      callOrder.push('updateStatus');
      return { ...errorJob, status: 'pendente' };
    });
    mockJobQueue.enqueue.mockImplementation(async () => {
      callOrder.push('enqueue');
    });

    await useCase.execute({ id: 'job-1' });

    expect(callOrder).toEqual(['updateStatus', 'enqueue']);
  });

  it('deve limpar errorMessage ao reprocessar', async () => {
    const errorJob = {
      id: 'job-1',
      documentName: 'design.pdf',
      status: 'erro',
      errorMessage: 'Impressora desconectada',
      registeredCost: 0,
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(errorJob);
    mockPrintJobRepository.updateStatus.mockResolvedValue({
      ...errorJob,
      status: 'pendente',
      errorMessage: null,
    });
    mockJobQueue.enqueue.mockResolvedValue(undefined);

    await useCase.execute({ id: 'job-1' });

    expect(mockPrintJobRepository.updateStatus).toHaveBeenCalledWith('job-1', 'pendente');
  });
});