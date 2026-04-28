export type ShopeeWebhookEventType = 'shop_order:new_order' | 'shop_order:cancelled';
export type ShopeeWebhookEventStatus = 'pending' | 'processing' | 'completed' | 'failed';

const VALID_EVENT_TYPES: ShopeeWebhookEventType[] = [
  'shop_order:new_order',
  'shop_order:cancelled',
];

const MAX_RETRIES = 3;

export class ShopeeWebhookEvent {
  private id: string;
  private eventType: ShopeeWebhookEventType;
  private shopeeOrderId: string;
  private data: any;
  private status: ShopeeWebhookEventStatus;
  private retryCount: number;
  private errorMessage: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    eventType: ShopeeWebhookEventType,
    shopeeOrderId: string,
    data: any,
    status: ShopeeWebhookEventStatus = 'pending',
    retryCount: number = 0,
    errorMessage: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.eventType = eventType;
    this.shopeeOrderId = shopeeOrderId;
    this.data = data;
    this.status = status;
    this.retryCount = retryCount;
    this.errorMessage = errorMessage;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create(input: {
    eventType: string;
    shopeeOrderId: string;
    data: any;
  }): ShopeeWebhookEvent {
    if (!VALID_EVENT_TYPES.includes(input.eventType as ShopeeWebhookEventType)) {
      throw new Error(`Tipo de evento inválido: ${input.eventType}`);
    }

    if (!input.shopeeOrderId || input.shopeeOrderId.trim() === '') {
      throw new Error('shopeeOrderId é obrigatório');
    }

    const id = crypto.randomUUID();
    return new ShopeeWebhookEvent(
      id,
      input.eventType as ShopeeWebhookEventType,
      input.shopeeOrderId,
      input.data
    );
  }

  getId(): string {
    return this.id;
  }

  getEventType(): ShopeeWebhookEventType {
    return this.eventType;
  }

  getShopeeOrderId(): string {
    return this.shopeeOrderId;
  }

  getData(): any {
    return this.data;
  }

  getStatus(): ShopeeWebhookEventStatus {
    return this.status;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  markAsProcessing(): void {
    if (this.status !== 'pending' && this.status !== 'failed') {
      throw new Error(`Não é possível processar evento com status: ${this.status}`);
    }
    this.status = 'processing';
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    if (this.status !== 'processing') {
      throw new Error('Apenas eventos em processamento podem ser marcados como concluídos');
    }
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    if (this.status !== 'processing') {
      throw new Error('Apenas eventos em processamento podem falhar');
    }
    this.retryCount += 1;
    this.errorMessage = errorMessage;
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  canRetry(): boolean {
    return this.retryCount < MAX_RETRIES;
  }

  // Getters for use in templates
  get eventType_(): ShopeeWebhookEventType {
    return this.eventType;
  }

  get shopeeOrderId_(): string {
    return this.shopeeOrderId;
  }

  get data_(): any {
    return this.data;
  }

  get status_(): ShopeeWebhookEventStatus {
    return this.status;
  }

  get retryCount_(): number {
    return this.retryCount;
  }

  get errorMessage_(): string | null {
    return this.errorMessage;
  }

  get createdAt_(): Date {
    return this.createdAt;
  }

  get updatedAt_(): Date {
    return this.updatedAt;
  }
}
