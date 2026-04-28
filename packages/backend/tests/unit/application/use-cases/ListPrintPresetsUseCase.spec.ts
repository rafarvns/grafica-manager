import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListPrintPresetsUseCase } from '@/application/use-cases/ListPrintPresetsUseCase';

const mockPrintPresetRepository = {
  findAll: vi.fn(),
};

describe('ListPrintPresetsUseCase', () => {
  let useCase: ListPrintPresetsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListPrintPresetsUseCase(mockPrintPresetRepository);
  });

  it('deve listar todos os presets', async () => {
    const presets = [
      {
        id: 'preset-1',
        name: 'Cartaz Alta Resolução',
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        paperTypeName: 'Couchê',
        quality: 'alta',
        dpi: 600,
        createdAt: new Date(),
      },
      {
        id: 'preset-2',
        name: 'Flyer Normal',
        colorMode: 'RGB',
        paperTypeId: 'paper-456',
        paperTypeName: 'Sulfite',
        quality: 'normal',
        dpi: 300,
        createdAt: new Date(),
      },
    ];

    mockPrintPresetRepository.findAll.mockResolvedValue(presets);

    const result = await useCase.execute();

    expect(result).toEqual(presets);
    expect(mockPrintPresetRepository.findAll).toHaveBeenCalled();
  });

  it('deve retornar lista vazia se não há presets', async () => {
    mockPrintPresetRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('deve retornar presets com informações de papel type', async () => {
    const presets = [
      {
        id: 'preset-1',
        name: 'Cartaz Alta Resolução',
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        paperTypeName: 'Couchê Brilhante 150g',
        quality: 'alta',
        dpi: 600,
        createdAt: new Date(),
      },
    ];

    mockPrintPresetRepository.findAll.mockResolvedValue(presets);

    const result = await useCase.execute();

    expect(result[0].paperTypeName).toBe('Couchê Brilhante 150g');
  });
});
