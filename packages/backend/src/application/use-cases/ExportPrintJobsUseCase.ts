import type { ExportPrintJobsInput, ExportPrintJobsOutput } from '@/application/dtos/ExportPrintJobsDTO';

export interface IPrintJobExportRepository {
  findWithFilters(filters: any): Promise<any>;
}

export interface ICsvExporter {
  export(data: any[]): Promise<Buffer>;
}

export interface IPdfExporter {
  export(data: any[]): Promise<Buffer>;
}

const VALID_FORMATS = ['csv', 'pdf'];

export class ExportPrintJobsUseCase {
  constructor(
    private readonly printJobRepository: IPrintJobExportRepository,
    private readonly csvExporter: ICsvExporter,
    private readonly pdfExporter: IPdfExporter
  ) {}

  async execute(input: ExportPrintJobsInput): Promise<Buffer> {
    if (!VALID_FORMATS.includes(input.format)) {
      throw new Error(`Formato inválido. Aceitos: ${VALID_FORMATS.join(', ')}`);
    }

    const filters: any = { exportAll: true };

    if (input.startDate) filters.startDate = input.startDate;
    if (input.endDate) filters.endDate = input.endDate;
    if (input.status) filters.status = input.status;
    if (input.customerId) filters.customerId = input.customerId;
    if (input.orderId) filters.orderId = input.orderId;
    if (input.documentName) filters.documentName = input.documentName;
    if (input.origin) filters.origin = input.origin;

    const result = await this.printJobRepository.findWithFilters(filters);
    const jobs = result.data || result;

    if (input.format === 'csv') {
      return this.csvExporter.export(jobs);
    }

    return this.pdfExporter.export(jobs);
  }
}