import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatePaperTypeUseCase } from '@/application/use-cases/CreatePaperTypeUseCase';
import { CreatePaperTypeInput, CreatePaperTypeOutput } from '@/application/dtos/CreatePaperTypeDTO';

// Mock repository
const mockPaperTypeRepository = {
  create: vi.fn(),
  findByName: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('CreatePaperTypeUseCase', () => {
  let useCase: CreatePaperTypeUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreatePaperTypeUseCase(mockPaperTypeRepository);
  });

  it('deve criar tipo de papel com dados válidos', async () => {
    const input: CreatePaperTypeInput = {
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    };

    const expectedOutput: CreatePaperTypeOutput = {
      id: '123',
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
      createdAt: expect.any(Date),
    };

    mockPaperTypeRepository.findByName.mockResolvedValue(null);
    mockPaperTypeRepository.create.mockResolvedValue(expectedOutput);

    const result = await useCase.execute(input);

    expect(mockPaperTypeRepository.findByName).toHaveBeenCalledWith('Couchê Brilhante');
    expect(mockPaperTypeRepository.create).toHaveBeenCalledWith({
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    });
    expect(result).toEqual(expectedOutput);
  });

  it('deve lançar erro se nome do papel estiver vazio', async () => {
    const input: CreatePaperTypeInput = {
      name: '',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Nome do tipo de papel é obrigatório');
  });

  it('deve lançar erro se peso estiver vazio', async () => {
    const input: CreatePaperTypeInput = {
      name: 'Couchê',
      weight: 0,
      standardSize: 'A4',
      color: 'Branco',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Peso do papel deve ser maior que 0');
  });

  it('deve lançar erro se já existe tipo de papel com mesmo nome', async () => {
    const input: CreatePaperTypeInput = {
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    };

    mockPaperTypeRepository.findByName.mockResolvedValue({
      id: '999',
      name: 'Couchê Brilhante',
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      'Já existe um tipo de papel com este nome'
    );
  });

  it('deve trimmar nome do papel', async () => {
    const input: CreatePaperTypeInput = {
      name: '  Couchê Brilhante  ',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    };

    mockPaperTypeRepository.findByName.mockResolvedValue(null);
    mockPaperTypeRepository.create.mockResolvedValue({
      id: '123',
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
      createdAt: new Date(),
    });

    await useCase.execute(input);

    expect(mockPaperTypeRepository.findByName).toHaveBeenCalledWith('Couchê Brilhante');
    expect(mockPaperTypeRepository.create).toHaveBeenCalledWith({
      name: 'Couchê Brilhante',
      weight: 150,
      standardSize: 'A4',
      color: 'Branco',
    });
  });
});
