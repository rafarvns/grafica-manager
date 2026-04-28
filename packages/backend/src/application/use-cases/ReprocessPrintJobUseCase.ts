import type { ReprocessPrintJobInput, ReprocessPrintJobOutput } from '@/application/dtos/ReprocessPrintJobDTO';

export interface IPrintJobRepository {
  findById(id: string): Promise<any>;
  updateStatus(id: string, status: string): Promise<any>;
}

export interface IJobQueue {
  enqueue(jobId: string): Promise<void>;
}

export class ReprocessPrintJobUseCase {
  constructor(
    private readonly printJobRepository: IPrintJobRepository,
    private readonly jobQueue: IJobQueue
  ) {}

  async execute(input: ReprocessPrintJobInput): Promise<ReprocessPrintJobOutput> {
    const job = await this.printJobRepository.findById(input.id);

    if (!job) {
      throw new Error('Impressão não encontrada');
    }

    if (job.status !== 'erro') {
      throw new Error('Apenas impressões com status "erro" podem ser reprocessadas');
    }

    await this.printJobRepository.updateStatus(input.id, 'pendente');
    await this.jobQueue.enqueue(input.id);

    return {
      id: input.id,
      status: 'pendente',
      message: 'Impressão reprocessada com sucesso',
    };
  }
}