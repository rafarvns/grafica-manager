import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatePrintPresetUseCase } from '@/application/use-cases/CreatePrintPresetUseCase';
import { CreatePrintPresetInput, CreatePrintPresetOutput } from '@/application/dtos/CreatePrintPresetDTO';

// Mocks
const mockPrintPresetRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
};

const mockPaperTypeRepository = {
  findById: vi.fn(),
};

describe('CreatePrintPresetUseCase', () => {
  let useCase: CreatePrintPresetUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreatePrintPresetUseCase(mockPrintPresetRepository as any, mockPaperTypeRepository as any);
  });

  it('deve criar preset com dados válidos', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      finish: 'nenhum',
    };

    const repoOutput: any = {
      id: 'preset-123',
      name: 'Cartaz Alta Resolução',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      finish: 'nenhum',
      active: true,
      createdAt: new Date(),
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findAll.mockResolvedValue([]);
    mockPrintPresetRepository.create.mockResolvedValue(repoOutput);

    const result = await useCase.execute(input);

    expect(mockPaperTypeRepository.findById).toHaveBeenCalledWith('paper-123');
    expect(mockPrintPresetRepository.create).toHaveBeenCalledWith({
      name: 'Cartaz Alta Resolução',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      finish: 'nenhum',
      active: true,
    });
    
    expect(result).toEqual({
      id: repoOutput.id,
      name: repoOutput.name,
      paperTypeId: repoOutput.paperTypeId,
      paperTypeName: 'Couchê Brilhante',
      quality: repoOutput.quality,
      colors: repoOutput.colors,
      finish: repoOutput.finish,
      active: repoOutput.active,
      createdAt: repoOutput.createdAt,
    });
  });

  it('deve lançar erro se nome do preset estiver vazio', async () => {
    const input: CreatePrintPresetInput = {
      name: '',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      finish: 'nenhum',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Nome do preset é obrigatório');
  });

  it('deve lançar erro se já existe preset com mesmo nome', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      paperTypeId: 'paper-123',
      quality: 'padrão',
      colors: 'colorido',
      finish: 'nenhum',
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findAll.mockResolvedValue([
      { name: 'Cartaz Alta Resolução' }
    ]);

    await expect(useCase.execute(input)).rejects.toThrow('Já existe um preset com este nome');
  });
});
