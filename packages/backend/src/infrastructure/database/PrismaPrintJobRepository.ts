import { PrismaClient } from '@prisma/client';
import { ListPrintJobsOutput, PaginatedPrintJobsResult } from '@/application/dtos/ListPrintJobsDTO';

export class PrismaPrintJobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findWithFilters(filters: any): Promise<PaginatedPrintJobsResult> {
    const {
      startDate,
      endDate,
      status,
      orderId,
      documentName,
      customerId,
      origin,
      page = 1,
      pageSize = 25,
      sortBy = 'date',
      sortOrder = 'desc',
      exportAll = false,
    } = filters;

    const where: any = {};

    // Filtro de período
    if (startDate || endDate) {
      where.printedAt = {};
      if (startDate) where.printedAt.gte = new Date(startDate);
      if (endDate) where.printedAt.lte = new Date(endDate);
    }

    // Filtro de status (mapear do formato da spec para o formato do banco)
    if (status) {
      const statusMap: Record<string, string> = {
        sucesso: 'success',
        erro: 'error',
        cancelada: 'cancelled',
        pendente: 'pending',
      };
      where.status = statusMap[status] || status;
    }

    // Filtro por orderId
    if (orderId) {
      where.OR = [
        { orderId: { contains: orderId } },
        { order: { orderNumber: { contains: orderId } } },
      ];
    }

    // Filtro por documentName
    if (documentName) {
      // PrintJob não tem documentName diretamente — buscar por order description
      where.order = { ...(where.order || {}), description: { contains: documentName } };
    }

    // Filtro por customerId
    if (customerId) {
      where.order = { ...(where.order || {}), customerId };
    }

    // Filtro por origin
    if (origin) {
      const originMap: Record<string, string> = {
        SHOPEE: 'SHOPEE',
        MANUAL: 'MANUAL',
      };
      where.order = {
        ...(where.order || {}),
        ...(origin ? { store: { source: originMap[origin] || origin } } : {}),
      };
    }

    // Mapear sortBy para campos do Prisma
    const sortMap: Record<string, any> = {
      date: { printedAt: sortOrder },
      cost: { registeredCost: sortOrder },
      status: { status: sortOrder },
      customer: { order: { customer: { name: sortOrder } } },
    };

    const orderBy = sortMap[sortBy] || { printedAt: 'desc' };

    // Se exportAll, buscar todos sem paginação
    if (exportAll) {
      const jobs = await this.prisma.printJob.findMany({
        where,
        orderBy,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerId: true,
              customer: { select: { name: true } },
              store: { select: { source: true } },
            },
          },
          paper: { select: { name: true } },
          printer: { select: { name: true } },
          preset: { select: { name: true } },
        },
      });

      return {
        data: jobs.map((job) => this.mapToOutput(job)),
        total: jobs.length,
        page: 1,
        pageSize: jobs.length,
      };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.printJob.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerId: true,
              customer: { select: { name: true } },
              store: { select: { source: true } },
            },
          },
          paper: { select: { name: true } },
          printer: { select: { name: true } },
          preset: { select: { name: true } },
        },
      }),
      this.prisma.printJob.count({ where }),
    ]);

    return {
      data: jobs.map((job) => this.mapToOutput(job)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<any> {
    const job = await this.prisma.printJob.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerId: true,
            customer: { select: { name: true } },
            store: { select: { source: true } },
          },
        },
        paper: { select: { name: true } },
        printer: { select: { name: true } },
        preset: { select: { name: true } },
      },
    });

    if (!job) return null;
    return this.mapToDetailOutput(job);
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const statusMap: Record<string, string> = {
      pendente: 'pending',
      sucesso: 'success',
      erro: 'error',
      cancelada: 'cancelled',
    };

    const job = await this.prisma.printJob.update({
      where: { id },
      data: {
        status: statusMap[status] || status,
        ...(status === 'pending' ? { errorMessage: null } : {}),
      },
    });

    return this.mapToOutput(job);
  }

  private mapToOutput(job: any): ListPrintJobsOutput {
    const statusMap: Record<string, string> = {
      success: 'sucesso',
      error: 'erro',
      cancelled: 'cancelada',
      pending: 'pendente',
    };

    return {
      id: job.id,
      documentName: job.order?.orderNumber || job.id,
      paperTypeId: job.paperTypeId || '',
      paperTypeName: job.paper?.name,
      quality: job.quality,
      colorMode: job.colorProfile,
      dpi: job.dpi || 300,
      pageCount: (job.pagesBlackAndWhite || 0) + (job.pagesColor || 0),
      status: statusMap[job.status] || job.status,
      registeredCost: Number(job.registeredCost) || 0,
      errorMessage: job.errorMessage || undefined,
      orderId: job.orderId || undefined,
      orderNumber: job.order?.orderNumber || undefined,
      customerId: job.order?.customerId || undefined,
      customerName: job.order?.customer?.name || undefined,
      origin: job.order?.store?.source || undefined,
      createdAt: job.printedAt || job.createdAt,
    };
  }

  private mapToDetailOutput(job: any): any {
    const output = this.mapToOutput(job);
    return {
      ...output,
      printerId: job.printerId,
      printerName: job.printer?.name,
      presetId: job.presetId || undefined,
      presetName: job.preset?.name || undefined,
      paperWeight: job.paperWeight,
      pagesBlackAndWhite: job.pagesBlackAndWhite || 0,
      pagesColor: job.pagesColor || 0,
    };
  }
}