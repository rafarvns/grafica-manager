import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeletePaperTypeUseCase } from '@/application/use-cases/DeletePaperTypeUseCase';
import { PaperTypeInUseError } from '@/domain/errors/PaperTypeInUseError';

const mockPaperTypeRepository = {
  delete: vi.fn(),
  findById: vi.fn(),
  softDelete: vi.fn(),
  countActiveOrders: vi.fn(),
};

const mockPrintPresetRepository = {
  findByPaperTypeId: vi.fn(),
};

describe('DeletePaperTypeUseCase', () => {
  let useCase: DeletePaperTypeUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeletePaperTypeUseCase(mockPaperTypeRepository as any, mockPrintPresetRepository as any);
  });

  it('deve deletar tipo de papel se não está em uso', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([]);
    mockPaperTypeRepository.countActiveOrders.mockResolvedValue(0);
    mockPaperTypeRepository.delete.mockResolvedValue(true);

    const result = await useCase.execute(paperId);

    expect(mockPaperTypeRepository.findById).toHaveBeenCalledWith(paperId);
    expect(mockPaperTypeRepository.countActiveOrders).toHaveBeenCalledWith(paperId);
    expect(mockPaperTypeRepository.delete).toHaveBeenCalledWith(paperId);
    expect(result).toEqual({ success: true, message: 'Tipo de papel deletado com sucesso' });
  });

  it('deve lançar erro se tipo de papel está em uso por pedidos ativos', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([]);
    mockPaperTypeRepository.countActiveOrders.mockResolvedValue(3);

    await expect(useCase.execute(paperId)).rejects.toThrow(
      'Tipo de papel está em uso em 3 pedidos ativos. Desative ao invés de deletar.'
    );
  });

  it('deve permitir soft-delete (mudar status ativo)', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
      active: true,
    });
    mockPaperTypeRepository.softDelete.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
      active: false,
    });

    const result = await useCase.toggleActive(paperId, false);

    expect(mockPaperTypeRepository.softDelete).toHaveBeenCalledWith(paperId);
    expect(result.active).toBe(false);
  });
});
