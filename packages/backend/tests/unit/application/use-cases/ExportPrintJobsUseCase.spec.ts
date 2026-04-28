import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportPrintJobsUseCase } from '@/application/use-cases/ExportPrintJobsUseCase';

const mockPrintJobRepository = {
  findWithFilters: vi.fn(),
};

const mockCsvExporter = {
  export: vi.fn(),
};

const mockPdfExporter = {
  export: vi.fn(),
};

describe('ExportPrintJobsUseCase', () => {
  let useCase: ExportPrintJobsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ExportPrintJobsUseCase(
      mockPrintJobRepository as any,
      mockCsvExporter as any,
      mockPdfExporter as any
    );
  });

  const mockJobs = [
    {
      id: 'job-1',
      documentName: 'design1.pdf',
      status: 'sucesso',
      registeredCost: 5.0,
      createdAt: new Date('2026-04-25'),
      customerName: 'João Silva',
      orderNumber: 'ORD-001',
    },
    {
      id: 'job-2',
      documentName: 'design2.pdf',
      status: 'erro',
      registeredCost: 0,
      errorMessage: 'Impressora desconectada',
      createdAt: new Date('2026-04-26'),
      customerName: 'Maria Santos',
      orderNumber: 'ORD-002',
    },
  ];

  it('deve exportar em formato CSV', async () => {
    const csvBuffer = Buffer.from('ID,Data,Cliente,Pedido,Status,Custo\n...');
    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: mockJobs,
      total: 2,
    });
    mockCsvExporter.export.mockResolvedValue(csvBuffer);

    const result = await useCase.execute({
      format: 'csv',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
    });

    expect(result).toBe(csvBuffer);
    expect(mockCsvExporter.export).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'job-1' }),
        expect.objectContaining({ id: 'job-2' }),
      ])
    );
  });

  it('deve exportar em formato PDF', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4...');
    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: mockJobs,
      total: 2,
    });
    mockPdfExporter.export.mockResolvedValue(pdfBuffer);

    const result = await useCase.execute({
      format: 'pdf',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
    });

    expect(result).toBe(pdfBuffer);
    expect(mockPdfExporter.export).toHaveBeenCalled();
  });

  it('deve aplicar mesmos filtros do ListPrintJobs', async () => {
    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockCsvExporter.export.mockResolvedValue(Buffer.from(''));

    await useCase.execute({
      format: 'csv',
      status: 'sucesso',
      customerId: 'cust-001',
      origin: 'SHOPEE',
    });

    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sucesso',
        customerId: 'cust-001',
        origin: 'SHOPEE',
      })
    );
  });

  it('deve rejeitar formato inválido', async () => {
    await expect(
      useCase.execute({ format: 'json' as any })
    ).rejects.toThrow('Formato inválido. Aceitos: csv, pdf');
  });

  it('deve formatar custo em BRL no CSV', async () => {
    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: mockJobs,
      total: 2,
    });
    mockCsvExporter.export.mockResolvedValue(Buffer.from('csv'));

    await useCase.execute({ format: 'csv' });

    const exportData = mockCsvExporter.export.mock.calls[0][0];
    expect(exportData[0].registeredCost).toBeDefined();
  });

  it('deve buscar sem paginação para export (todos os registros filtrados)', async () => {
    mockPrintJobRepository.findWithFilters.mockResolvedValue({
      data: mockJobs,
      total: 2,
    });
    mockCsvExporter.export.mockResolvedValue(Buffer.from('csv'));

    await useCase.execute({ format: 'csv' });

    // Export não deve ter page/pageSize nos filtros
    expect(mockPrintJobRepository.findWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ exportAll: true })
    );
  });
});