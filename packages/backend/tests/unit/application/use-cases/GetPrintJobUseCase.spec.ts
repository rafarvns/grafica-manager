import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetPrintJobUseCase } from '@/application/use-cases/GetPrintJobUseCase';

const mockPrintJobRepository = {
  findById: vi.fn(),
};

describe('GetPrintJobUseCase', () => {
  let useCase: GetPrintJobUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetPrintJobUseCase(mockPrintJobRepository as any);
  });

  it('deve retornar detalhe completo com breakdown de custo', async () => {
    const job = {
      id: 'job-1',
      documentName: 'design.pdf',
      paperTypeId: 'paper-123',
      paperTypeName: 'Sulfite A4',
      quality: 'normal',
      colorMode: 'CMYK',
      dpi: 300,
      pageCount: 10,
      status: 'sucesso',
      registeredCost: 5.0,
      orderId: 'order-001',
      orderNumber: 'ORD-001',
      customerId: 'cust-001',
      customerName: 'João Silva',
      origin: 'MANUAL',
      printerId: 'printer-1',
      printerName: 'HP LaserJet',
      pagesBlackAndWhite: 8,
      pagesColor: 2,
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(job);

    const result = await useCase.execute({ id: 'job-1' });

    expect(result.id).toBe('job-1');
    expect(result.documentName).toBe('design.pdf');
    expect(result.customerName).toBe('João Silva');
    expect(result.orderNumber).toBe('ORD-001');
    expect(result.registeredCost).toBe(5.0);
    expect(result.costBreakdown).toBeDefined();
    expect(result.costBreakdown!.total).toBe(5.0);
  });

  it('deve lançar erro se impressão não encontrada', async () => {
    mockPrintJobRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'job-inexistente' })).rejects.toThrow(
      'Impressão não encontrada'
    );
  });

  it('deve calcular breakdown de custo para impressão bem-sucedida', async () => {
    const job = {
      id: 'job-2',
      documentName: 'cartao.pdf',
      paperTypeId: 'paper-456',
      paperTypeName: 'Couchê 150g',
      quality: 'alta',
      colorMode: 'CMYK',
      dpi: 600,
      pageCount: 20,
      status: 'sucesso',
      registeredCost: 20.0,
      orderId: 'order-002',
      orderNumber: 'ORD-002',
      customerId: 'cust-002',
      customerName: 'Maria Santos',
      origin: 'SHOPEE',
      printerId: 'printer-2',
      printerName: 'Epson L3150',
      pagesBlackAndWhite: 0,
      pagesColor: 20,
      createdAt: new Date('2026-04-26'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(job);

    const result = await useCase.execute({ id: 'job-2' });

    expect(result.costBreakdown).toBeDefined();
    expect(result.costBreakdown!.paperCost).toBeGreaterThan(0);
    expect(result.costBreakdown!.total).toBe(20.0);
  });

  it('deve retornar breakdown zerado para impressão com erro', async () => {
    const job = {
      id: 'job-3',
      documentName: 'erro.pdf',
      paperTypeId: 'paper-789',
      quality: 'rascunho',
      colorMode: 'GRAYSCALE',
      dpi: 150,
      pageCount: 5,
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      orderId: null,
      orderNumber: null,
      customerId: null,
      customerName: null,
      origin: null,
      createdAt: new Date('2026-04-27'),
    };

    mockPrintJobRepository.findById.mockResolvedValue(job);

    const result = await useCase.execute({ id: 'job-3' });

    expect(result.costBreakdown).toBeDefined();
    expect(result.costBreakdown!.total).toBe(0);
    expect(result.costBreakdown!.paperCost).toBe(0);
  });
});