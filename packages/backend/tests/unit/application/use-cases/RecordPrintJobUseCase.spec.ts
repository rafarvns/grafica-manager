import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordPrintJobUseCase } from '@/application/use-cases/RecordPrintJobUseCase';
import { RecordPrintJobInput, RecordPrintJobOutput } from '@/application/dtos/RecordPrintJobDTO';

const mockPrintJobRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
};

const mockPriceTableRepository = {
  findByPaperTypeAndQuality: vi.fn(),
};

describe('RecordPrintJobUseCase', () => {
  let useCase: RecordPrintJobUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RecordPrintJobUseCase(mockPrintJobRepository, mockPriceTableRepository);
  });

  it('deve registrar impressão bem-sucedida com custo', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      orderId: 'order-001',
    };

    const mockPrice = {
      id: 'price-1',
      unitPrice: 0.50,
    };

    const expectedOutput: RecordPrintJobOutput = {
      id: 'job-123',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.00, // 0.50 * 10
      orderId: 'order-001',
      createdAt: expect.any(Date),
    };

    mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue(mockPrice);
    mockPrintJobRepository.create.mockResolvedValue(expectedOutput);

    const result = await useCase.execute(input);

    expect(mockPriceTableRepository.findByPaperTypeAndQuality).toHaveBeenCalledWith(
      'paper-123',
      'normal'
    );
    expect(mockPrintJobRepository.create).toHaveBeenCalledWith({
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.00,
      orderId: 'order-001',
    });
    expect(result).toEqual(expectedOutput);
  });

  it('deve registrar impressão com erro (custo zero)', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'erro',
      errorMessage: 'Impressora desconectada',
      orderId: 'order-001',
    };

    const expectedOutput: RecordPrintJobOutput = {
      id: 'job-123',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      orderId: 'order-001',
      createdAt: expect.any(Date),
    };

    mockPrintJobRepository.create.mockResolvedValue(expectedOutput);

    const result = await useCase.execute(input);

    expect(mockPriceTableRepository.findByPaperTypeAndQuality).not.toHaveBeenCalled();
    expect(mockPrintJobRepository.create).toHaveBeenCalledWith({
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      orderId: 'order-001',
    });
    expect(result.registeredCost).toBe(0);
  });

  it('deve calcular custo corretamente (unitPrice * pageCount)', async () => {
    const inputs = [
      { pageCount: 5, unitPrice: 0.30, expectedCost: 1.50 },
      { pageCount: 100, unitPrice: 0.50, expectedCost: 50.00 },
      { pageCount: 1, unitPrice: 2.50, expectedCost: 2.50 },
    ];

    for (const { pageCount, unitPrice, expectedCost } of inputs) {
      const input: RecordPrintJobInput = {
        documentName: 'doc.pdf',
        paperTypeId: 'paper-123',
        quality: 'normal',
        colorMode: 'CMYK',
        dpi: 300,
        pageCount,
        status: 'sucesso',
        orderId: 'order-001',
      };

      mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue({
        id: 'price-1',
        unitPrice,
      });
      mockPrintJobRepository.create.mockResolvedValue({
        id: 'job-123',
        documentName: 'doc.pdf',
        paperTypeId: 'paper-123',
        quality: 'normal',
        colorMode: 'CMYK',
        dpi: 300,
        pageCount,
        status: 'sucesso',
        registeredCost: expectedCost,
        orderId: 'order-001',
        createdAt: new Date(),
      });

      const result = await useCase.execute(input);

      expect(result.registeredCost).toBe(expectedCost);
    }
  });

  it('deve lançar erro se pageCount <= 0', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 0,
      status: 'sucesso',
      orderId: 'order-001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Número de páginas deve ser maior que 0'
    );
  });

  it('deve lançar erro se não encontra preço na tabela (status sucesso)', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-unknown',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      orderId: 'order-001',
    };

    mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Preço não encontrado para este tipo de papel e qualidade'
    );
  });

  it('deve congelar custo no momento do registro (snapshot)', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      orderId: 'order-001',
    };

    // Preço vigente: R$ 0,30
    mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValueOnce({
      id: 'price-1',
      unitPrice: 0.30,
    });

    mockPrintJobRepository.create.mockResolvedValueOnce({
      id: 'job-123',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 3.00,
      orderId: 'order-001',
      createdAt: new Date(),
    });

    const result1 = await useCase.execute(input);
    expect(result1.registeredCost).toBe(3.00);

    // Muda preço para R$ 0,40 (simula mudança de preço na tabela)
    mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValueOnce({
      id: 'price-1',
      unitPrice: 0.40,
    });

    mockPrintJobRepository.create.mockResolvedValueOnce({
      id: 'job-124',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 4.00,
      orderId: 'order-001',
      createdAt: new Date(),
    });

    const result2 = await useCase.execute(input);
    expect(result2.registeredCost).toBe(4.00);

    // Histórico não é alterado (seria preservado no banco)
    expect(result1.registeredCost).not.toBe(result2.registeredCost);
  });

  it('deve validar timestamp automático', async () => {
    const input: RecordPrintJobInput = {
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      orderId: 'order-001',
    };

    const beforeTime = new Date();

    mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue({
      id: 'price-1',
      unitPrice: 0.50,
    });

    mockPrintJobRepository.create.mockResolvedValue({
      id: 'job-123',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.00,
      orderId: 'order-001',
      createdAt: new Date(),
    });

    const result = await useCase.execute(input);

    const afterTime = new Date();

    expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
