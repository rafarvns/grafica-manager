import type { GetPrintJobInput, GetPrintJobOutput, PrintJobCostBreakdown } from '@/application/dtos/GetPrintJobDTO';

export interface IPrintJobDetailRepository {
  findById(id: string): Promise<any>;
}

export class GetPrintJobUseCase {
  constructor(private readonly printJobRepository: IPrintJobDetailRepository) {}

  async execute(input: GetPrintJobInput): Promise<GetPrintJobOutput> {
    const job = await this.printJobRepository.findById(input.id);

    if (!job) {
      throw new Error('Impressão não encontrada');
    }

    const costBreakdown = this.calculateCostBreakdown(job);

    return {
      id: job.id,
      documentName: job.documentName,
      paperTypeId: job.paperTypeId ?? '',
      paperTypeName: job.paperTypeName ?? undefined,
      quality: job.quality,
      colorMode: job.colorMode,
      dpi: job.dpi,
      pageCount: job.pageCount,
      status: job.status,
      registeredCost: Number(job.registeredCost),
      errorMessage: job.errorMessage ?? undefined,
      orderId: job.orderId ?? undefined,
      orderNumber: job.orderNumber ?? undefined,
      customerId: job.customerId ?? undefined,
      customerName: job.customerName ?? undefined,
      origin: job.origin ?? undefined,
      printerId: job.printerId ?? undefined,
      printerName: job.printerName ?? undefined,
      pagesBlackAndWhite: job.pagesBlackAndWhite ?? 0,
      pagesColor: job.pagesColor ?? 0,
      costBreakdown,
      createdAt: job.createdAt,
    };
  }

  private calculateCostBreakdown(job: any): PrintJobCostBreakdown {
    const total = Number(job.registeredCost) || 0;

    if (total === 0) {
      return { paperCost: 0, marginCost: 0, discount: 0, total: 0 };
    }

    const pageCount = job.pageCount || 1;
    const paperCost = Math.round((total * 0.7) * 100) / 100;
    const marginCost = Math.round((total * 0.3) * 100) / 100;

    return {
      paperCost,
      marginCost,
      discount: 0,
      total,
    };
  }
}