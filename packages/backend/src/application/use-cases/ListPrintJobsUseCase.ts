import { ListPrintJobsInput, ListPrintJobsOutput, PaginatedPrintJobsResult } from '@/application/dtos/ListPrintJobsDTO';

const VALID_STATUSES = ['sucesso', 'erro', 'cancelada', 'pendente'];
const VALID_SORT_FIELDS = ['date', 'cost', 'status', 'customer'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_ORIGINS = ['SHOPEE', 'MANUAL'];
const MAX_PERIOD_DAYS = 366; // 1 ano + 1 dia para margem

export interface IPrintJobRepository {
  findWithFilters(filters: any): Promise<PaginatedPrintJobsResult>;
}

export class ListPrintJobsUseCase {
  constructor(private printJobRepository: IPrintJobRepository) {}

  async execute(input: ListPrintJobsInput): Promise<PaginatedPrintJobsResult> {
    // Validações
    this.validatePeriod(input);
    this.validateStatus(input);
    this.validatePagination(input);
    this.validateSorting(input);
    this.validateOrigin(input);

    // Construir filtros
    const filters: any = {};

    if (input.startDate) filters.startDate = input.startDate;
    if (input.endDate) filters.endDate = input.endDate;
    if (input.status) filters.status = input.status;
    if (input.orderId) filters.orderId = input.orderId;
    if (input.documentName) filters.documentName = input.documentName;
    if (input.customerId) filters.customerId = input.customerId;
    if (input.origin) filters.origin = input.origin;

    // Paginação (padrão: page=1, pageSize=25)
    filters.page = input.page ?? 1;
    filters.pageSize = input.pageSize ?? 25;

    // Sorting (padrão: date desc)
    if (input.sortBy) {
      filters.sortBy = input.sortBy;
      filters.sortOrder = input.sortOrder ?? 'desc';
    }

    return this.printJobRepository.findWithFilters(filters);
  }

  private validatePeriod(input: ListPrintJobsInput): void {
    if (input.startDate && input.endDate) {
      if (input.startDate > input.endDate) {
        throw new Error('startDate não pode ser posterior a endDate');
      }

      const diffMs = input.endDate.getTime() - input.startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > MAX_PERIOD_DAYS) {
        throw new Error('Período não pode exceder 1 ano');
      }
    }
  }

  private validateStatus(input: ListPrintJobsInput): void {
    if (input.status && !VALID_STATUSES.includes(input.status)) {
      throw new Error(`Status inválido. Aceitos: ${VALID_STATUSES.join(', ')}`);
    }
  }

  private validatePagination(input: ListPrintJobsInput): void {
    if (input.page !== undefined && input.page < 1) {
      throw new Error('page deve ser maior ou igual a 1');
    }
    if (input.pageSize !== undefined && (input.pageSize < 1 || input.pageSize > 100)) {
      throw new Error('pageSize deve ser entre 1 e 100');
    }
  }

  private validateSorting(input: ListPrintJobsInput): void {
    if (input.sortBy && !VALID_SORT_FIELDS.includes(input.sortBy)) {
      throw new Error(`sortBy inválido. Aceitos: ${VALID_SORT_FIELDS.join(', ')}`);
    }
    if (input.sortOrder && !VALID_SORT_ORDERS.includes(input.sortOrder)) {
      throw new Error(`sortOrder inválido. Aceitos: ${VALID_SORT_ORDERS.join(', ')}`);
    }
  }

  private validateOrigin(input: ListPrintJobsInput): void {
    if (input.origin && !VALID_ORIGINS.includes(input.origin)) {
      throw new Error(`origin inválido. Aceitos: ${VALID_ORIGINS.join(', ')}`);
    }
  }
}
