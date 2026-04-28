import { ListPrintJobsInput, ListPrintJobsOutput } from '@/application/dtos/ListPrintJobsDTO';

const VALID_STATUSES = ['sucesso', 'erro', 'cancelada'];

export interface IPrintJobRepository {
  findWithFilters(filters: any): Promise<ListPrintJobsOutput[]>;
}

export class ListPrintJobsUseCase {
  constructor(private printJobRepository: IPrintJobRepository) {}

  async execute(input: ListPrintJobsInput): Promise<ListPrintJobsOutput[]> {
    // Validar período
    if (input.startDate && input.endDate) {
      if (input.startDate > input.endDate) {
        throw new Error('startDate não pode ser posterior a endDate');
      }
    }

    // Validar status
    if (input.status && !VALID_STATUSES.includes(input.status)) {
      throw new Error(`Status inválido. Aceitos: ${VALID_STATUSES.join(', ')}`);
    }

    // Buscar com filtros
    const filters: any = {};

    if (input.startDate) {
      filters.startDate = input.startDate;
    }

    if (input.endDate) {
      filters.endDate = input.endDate;
    }

    if (input.status) {
      filters.status = input.status;
    }

    if (input.orderId) {
      filters.orderId = input.orderId;
    }

    if (input.documentName) {
      filters.documentName = input.documentName;
    }

    const printJobs = await this.printJobRepository.findWithFilters(filters);
    return printJobs;
  }
}
