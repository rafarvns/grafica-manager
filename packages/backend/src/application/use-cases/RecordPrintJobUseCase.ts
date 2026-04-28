import { RecordPrintJobInput, RecordPrintJobOutput } from '@/application/dtos/RecordPrintJobDTO';

export interface IPrintJobRepository {
  create(data: any): Promise<RecordPrintJobOutput>;
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
}

export interface IPriceTableRepository {
  findByPaperTypeAndQuality(paperTypeId: string, quality: string): Promise<any>;
}

export class RecordPrintJobUseCase {
  constructor(
    private printJobRepository: IPrintJobRepository,
    private priceTableRepository: IPriceTableRepository
  ) {}

  async execute(input: RecordPrintJobInput): Promise<RecordPrintJobOutput> {
    // Validar pageCount
    if (!input.pageCount || input.pageCount <= 0) {
      throw new Error('Número de páginas deve ser maior que 0');
    }

    let registeredCost = 0;

    // Se impressão foi bem-sucedida, calcular custo
    if (input.status === 'sucesso') {
      const priceEntry = await this.priceTableRepository.findByPaperTypeAndQuality(
        input.paperTypeId,
        input.quality
      );

      if (!priceEntry) {
        throw new Error('Preço não encontrado para este tipo de papel e qualidade');
      }

      // Snapshot do custo (congelado no momento do registro)
      registeredCost = priceEntry.unitPrice * input.pageCount;
    } else {
      // Se erro ou cancelada, custo é zero
      registeredCost = 0;
    }

    // Registrar impressão (append-only, imutável)
    const printJob = await this.printJobRepository.create({
      documentName: input.documentName,
      paperTypeId: input.paperTypeId,
      quality: input.quality,
      colorMode: input.colorMode,
      dpi: input.dpi,
      pageCount: input.pageCount,
      status: input.status,
      registeredCost,
      errorMessage: input.errorMessage,
      orderId: input.orderId,
    });

    return printJob;
  }
}
