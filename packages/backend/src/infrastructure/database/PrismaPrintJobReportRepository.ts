import { PrismaClient } from '@prisma/client';
import type { PrintJobReportRow } from '@grafica/shared';
import type { IPrintJobReportRepository } from '@/application/use-cases/GeneratePrintJobReportUseCase';
import { PrintJobReportFilter } from '@/domain/value-objects/PrintJobReportFilter';

const INCLUDE = {
  paper: { select: { name: true } },
  printer: { select: { name: true } },
  preset: { select: { name: true } },
  order: {
    select: {
      orderNumber: true,
      customerId: true,
      customer: { select: { name: true } },
    },
  },
} as const;

export class PrismaPrintJobReportRepository implements IPrintJobReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async queryRows(
    filter: PrintJobReportFilter
  ): Promise<{ rows: PrintJobReportRow[]; totalCount: number }> {
    const where = this.buildWhere(filter);
    const [jobs, totalCount] = await Promise.all([
      this.prisma.printJob.findMany({
        where,
        include: INCLUDE,
        orderBy: { printedAt: 'desc' },
        skip: filter.getOffset(),
        take: filter.pageSize,
      }),
      this.prisma.printJob.count({ where }),
    ]);
    return { rows: jobs.map((j) => this.map(j)), totalCount };
  }

  async queryAllRows(filter: PrintJobReportFilter): Promise<PrintJobReportRow[]> {
    const where = this.buildWhere(filter);
    const jobs = await this.prisma.printJob.findMany({
      where,
      include: INCLUDE,
      orderBy: { printedAt: 'desc' },
    });
    return jobs.map((j) => this.map(j));
  }

  private buildWhere(filter: PrintJobReportFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      printedAt: {
        gte: filter.period.from,
        lte: filter.period.to,
      },
    };

    if (filter.paperTypeIds?.length) where['paperTypeId'] = { in: filter.paperTypeIds };
    if (filter.colorProfiles?.length) where['colorProfile'] = { in: filter.colorProfiles };
    if (filter.qualities?.length) where['quality'] = { in: filter.qualities };
    if (filter.printerIds?.length) where['printerId'] = { in: filter.printerIds };
    if (filter.statuses?.length) where['status'] = { in: filter.statuses };

    return where;
  }

  private map(job: {
    id: string;
    printedAt: Date;
    createdAt: Date;
    documentName: string | null;
    paperType: string | null;
    paperWeight: number;
    colorProfile: string;
    quality: string;
    pagesBlackAndWhite: number;
    pagesColor: number;
    registeredCost: unknown;
    status: string;
    orderId: string | null;
    paper: { name: string } | null;
    printer: { name: string };
    preset: { name: string } | null;
    order: { orderNumber: string; customerId: string | null; customer: { name: string } | null } | null;
  }): PrintJobReportRow {
    const row: PrintJobReportRow = {
      id: job.id,
      printedAt: (job.printedAt ?? job.createdAt).toISOString(),
      documentName: job.documentName ?? job.order?.orderNumber ?? job.id,
      paperTypeName: job.paper?.name ?? job.paperType ?? 'Desconhecido',
      paperWeight: job.paperWeight,
      colorProfile: job.colorProfile as 'CMYK' | 'RGB' | 'GRAYSCALE',
      quality: job.quality as 'DRAFT' | 'NORMAL' | 'HIGH',
      pagesBlackAndWhite: job.pagesBlackAndWhite,
      pagesColor: job.pagesColor,
      totalPages: job.pagesBlackAndWhite + job.pagesColor,
      registeredCost: Number(job.registeredCost ?? 0),
      status: job.status as 'success' | 'error' | 'cancelled',
      printerName: job.printer.name,
    };

    if (job.preset?.name) row.presetName = job.preset.name;
    if (job.orderId) row.orderId = job.orderId;
    if (job.order?.orderNumber) row.orderNumber = job.order.orderNumber;
    if (job.order?.customer?.name) row.customerName = job.order.customer.name;

    return row;
  }
}
