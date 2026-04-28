import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeletePaperTypeUseCase } from '@/application/use-cases/DeletePaperTypeUseCase';
import { PaperTypeInUseError } from '@/domain/errors/PaperTypeInUseError';

const mockPaperTypeRepository = {
  delete: vi.fn(),
  findById: vi.fn(),
};

const mockPrintPresetRepository = {
  findByPaperTypeId: vi.fn(),
};

describe('DeletePaperTypeUseCase', () => {
  let useCase: DeletePaperTypeUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeletePaperTypeUseCase(mockPaperTypeRepository, mockPrintPresetRepository);
  });

  it('deve deletar tipo de papel se não está em uso', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([]);
    mockPaperTypeRepository.delete.mockResolvedValue(true);

    const result = await useCase.execute(paperId);

    expect(mockPaperTypeRepository.findById).toHaveBeenCalledWith(paperId);
    expect(mockPrintPresetRepository.findByPaperTypeId).toHaveBeenCalledWith(paperId);
    expect(mockPaperTypeRepository.delete).toHaveBeenCalledWith(paperId);
    expect(result).toEqual({ success: true, message: 'Tipo de papel deletado com sucesso' });
  });

  it('deve lançar erro se tipo de papel não encontrado', async () => {
    const paperId = 'invalid-id';

    mockPaperTypeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(paperId)).rejects.toThrow('Tipo de papel não encontrado');
  });

  it('deve lançar erro se tipo de papel está em uso por 1 preset', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([
      { id: 'preset-1', name: 'Documento Padrão' },
    ]);

    await expect(useCase.execute(paperId)).rejects.toThrow(
      expect.objectMatching({
        message: expect.stringContaining('está em uso por 1 preset'),
      })
    );
  });

  it('deve lançar erro se tipo de papel está em uso por múltiplos presets', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([
      { id: 'preset-1', name: 'Documento Padrão' },
      { id: 'preset-2', name: 'Documento Rápido' },
      { id: 'preset-3', name: 'Documento Alta Qualidade' },
    ]);

    await expect(useCase.execute(paperId)).rejects.toThrow(
      expect.objectMatching({
        message: expect.stringContaining('está em uso por 3 presets'),
      })
    );
  });

  it('deve permitir deleção forçada com flag force=true mesmo em uso', async () => {
    const paperId = 'paper-123';

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: paperId,
      name: 'Sulfite A4',
    });
    mockPrintPresetRepository.findByPaperTypeId.mockResolvedValue([
      { id: 'preset-1', name: 'Documento Padrão' },
    ]);
    mockPaperTypeRepository.delete.mockResolvedValue(true);

    const result = await useCase.execute(paperId, { force: true });

    expect(mockPaperTypeRepository.delete).toHaveBeenCalledWith(paperId);
    expect(result).toEqual({
      success: true,
      message: 'Tipo de papel deletado com sucesso',
      warning: 'Tipo de papel estava em uso por 1 preset(s)',
    });
  });
});
