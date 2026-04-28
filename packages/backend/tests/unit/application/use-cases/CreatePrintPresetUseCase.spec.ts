import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatePrintPresetUseCase } from '@/application/use-cases/CreatePrintPresetUseCase';
import { CreatePrintPresetInput, CreatePrintPresetOutput } from '@/application/dtos/CreatePrintPresetDTO';

// Mocks
const mockPrintPresetRepository = {
  create: vi.fn(),
  findByName: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockPaperTypeRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
};

describe('CreatePrintPresetUseCase', () => {
  let useCase: CreatePrintPresetUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreatePrintPresetUseCase(mockPrintPresetRepository, mockPaperTypeRepository);
  });

  it('deve criar preset com dados válidos', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 600,
    };

    const expectedOutput: CreatePrintPresetOutput = {
      id: 'preset-123',
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      paperTypeName: 'Couchê Brilhante',
      quality: 'alta',
      dpi: 600,
      createdAt: expect.any(Date),
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findByName.mockResolvedValue(null);
    mockPrintPresetRepository.create.mockResolvedValue(expectedOutput);

    const result = await useCase.execute(input);

    expect(mockPaperTypeRepository.findById).toHaveBeenCalledWith('paper-123');
    expect(mockPrintPresetRepository.findByName).toHaveBeenCalledWith('Cartaz Alta Resolução');
    expect(mockPrintPresetRepository.create).toHaveBeenCalledWith({
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 600,
    });
    expect(result).toEqual(expectedOutput);
  });

  it('deve lançar erro se nome do preset estiver vazio', async () => {
    const input: CreatePrintPresetInput = {
      name: '',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 600,
    };

    await expect(useCase.execute(input)).rejects.toThrow('Nome do preset é obrigatório');
  });

  it('deve lançar erro se tipo de papel não existe', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'invalid-paper-id',
      quality: 'alta',
      dpi: 600,
    };

    mockPaperTypeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow('Tipo de papel não encontrado');
  });

  it('deve lançar erro se já existe preset com mesmo nome', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 600,
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê Brilhante',
    });
    mockPrintPresetRepository.findByName.mockResolvedValue({
      id: 'preset-999',
      name: 'Cartaz Alta Resolução',
    });

    await expect(useCase.execute(input)).rejects.toThrow('Já existe um preset com este nome');
  });

  it('deve aceitar color modes válidos', async () => {
    const validColorModes = ['CMYK', 'RGB', 'GRAYSCALE'];

    for (const colorMode of validColorModes) {
      const input: CreatePrintPresetInput = {
        name: `Preset ${colorMode}`,
        colorMode,
        paperTypeId: 'paper-123',
        quality: 'normal',
        dpi: 300,
      };

      mockPaperTypeRepository.findById.mockResolvedValue({
        id: 'paper-123',
        name: 'Couchê',
      });
      mockPrintPresetRepository.findByName.mockResolvedValue(null);
      mockPrintPresetRepository.create.mockResolvedValue({
        id: 'preset-123',
        name: `Preset ${colorMode}`,
        colorMode,
        paperTypeId: 'paper-123',
        paperTypeName: 'Couchê',
        quality: 'normal',
        dpi: 300,
        createdAt: new Date(),
      });

      await useCase.execute(input);
    }

    expect(mockPrintPresetRepository.create).toHaveBeenCalledTimes(3);
  });

  it('deve lançar erro para color mode inválido', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      colorMode: 'INVALID_MODE',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 600,
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê',
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      'Color mode inválido. Aceitos: CMYK, RGB, GRAYSCALE'
    );
  });

  it('deve aceitar qualidades válidas', async () => {
    const validQualities = ['rascunho', 'normal', 'alta'];

    for (const quality of validQualities) {
      const input: CreatePrintPresetInput = {
        name: `Preset ${quality}`,
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        quality,
        dpi: 300,
      };

      mockPaperTypeRepository.findById.mockResolvedValue({
        id: 'paper-123',
        name: 'Couchê',
      });
      mockPrintPresetRepository.findByName.mockResolvedValue(null);
      mockPrintPresetRepository.create.mockResolvedValue({
        id: 'preset-123',
        name: `Preset ${quality}`,
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        paperTypeName: 'Couchê',
        quality,
        dpi: 300,
        createdAt: new Date(),
      });

      await useCase.execute(input);
    }

    expect(mockPrintPresetRepository.create).toHaveBeenCalledTimes(3);
  });

  it('deve aceitar DPIs válidos', async () => {
    const validDpis = [150, 300, 600];

    for (const dpi of validDpis) {
      const input: CreatePrintPresetInput = {
        name: `Preset ${dpi}dpi`,
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        quality: 'normal',
        dpi,
      };

      mockPaperTypeRepository.findById.mockResolvedValue({
        id: 'paper-123',
        name: 'Couchê',
      });
      mockPrintPresetRepository.findByName.mockResolvedValue(null);
      mockPrintPresetRepository.create.mockResolvedValue({
        id: 'preset-123',
        name: `Preset ${dpi}dpi`,
        colorMode: 'CMYK',
        paperTypeId: 'paper-123',
        paperTypeName: 'Couchê',
        quality: 'normal',
        dpi,
        createdAt: new Date(),
      });

      await useCase.execute(input);
    }

    expect(mockPrintPresetRepository.create).toHaveBeenCalledTimes(3);
  });

  it('deve lançar erro para DPI inválido', async () => {
    const input: CreatePrintPresetInput = {
      name: 'Cartaz Alta Resolução',
      colorMode: 'CMYK',
      paperTypeId: 'paper-123',
      quality: 'alta',
      dpi: 1200,
    };

    mockPaperTypeRepository.findById.mockResolvedValue({
      id: 'paper-123',
      name: 'Couchê',
    });

    await expect(useCase.execute(input)).rejects.toThrow('DPI inválido. Aceitos: 150, 300, 600');
  });
});
