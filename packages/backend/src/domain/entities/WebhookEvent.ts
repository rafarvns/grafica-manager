export type WebhookPlatform = 'shopee';
export type WebhookStatus = 'pending' | 'processing' | 'processed' | 'error' | 'discarded';

const VALID_PLATFORMS: WebhookPlatform[] = ['shopee'];
const MAX_RETRIES = 3;
const RETRY_DELAYS = [30000, 300000, 1800000]; // 30s, 5min, 30min

export class WebhookEvent {
  private _id: string;
  private _platform: WebhookPlatform;
  private _platformOrderId: string;
  private _payload: any;
  private _rawPayload: string;
  private _status: WebhookStatus;
  private _retryCount: number;
  private _lastError: string | null;
  private _discardReason: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    platform: WebhookPlatform,
    platformOrderId: string,
    payload: any,
    rawPayload: string,
    status: WebhookStatus = 'pending',
    retryCount: number = 0,
    lastError: string | null = null,
    discardReason: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this._id = id;
    this._platform = platform;
    this._platformOrderId = platformOrderId;
    this._payload = JSON.parse(JSON.stringify(payload)); // Deep copy for immutability
    this._rawPayload = rawPayload;
    this._status = status;
    this._retryCount = retryCount;
    this._lastError = lastError;
    this._discardReason = discardReason;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(input: {
    platform: string;
    platformOrderId: string;
    payload: any;
    rawPayload: string;
  }): WebhookEvent {
    if (!VALID_PLATFORMS.includes(input.platform as WebhookPlatform)) {
      throw new Error('Platform inválida');
    }

    if (!input.platformOrderId || input.platformOrderId.trim() === '') {
      throw new Error('platformOrderId é obrigatório');
    }

    const id = crypto.randomUUID();
    return new WebhookEvent(
      id,
      input.platform as WebhookPlatform,
      input.platformOrderId,
      input.payload,
      input.rawPayload
    );
  }

  getId(): string {
    return this._id;
  }

  get platform(): WebhookPlatform {
    return this._platform;
  }

  get platformOrderId(): string {
    return this._platformOrderId;
  }

  get payload(): any {
    return this._payload;
  }

  get rawPayload(): string {
    return this._rawPayload;
  }

  get status(): WebhookStatus {
    return this._status;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  get discardReason(): string | null {
    return this._discardReason;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  markAsProcessing(): void {
    if (this._status !== 'pending' && this._status !== 'error') {
      throw new Error(`Não é possível processar evento com status: ${this._status}`);
    }
    this._status = 'processing';
    this._updatedAt = new Date();
  }

  markAsProcessed(): void {
    if (this._status !== 'processing') {
      throw new Error('Apenas eventos em processamento podem ser marcados como processados');
    }
    this._status = 'processed';
    this._updatedAt = new Date();
  }

  markAsError(errorMessage: string): void {
    if (this._status !== 'processing') {
      throw new Error('Apenas eventos em processamento podem falhar');
    }
    this._lastError = errorMessage;
    this._status = 'error';
    this._retryCount += 1;
    this._updatedAt = new Date();
  }

  markAsDiscarded(reason: string): void {
    this._status = 'discarded';
    this._discardReason = reason;
    this._updatedAt = new Date();
  }

  canRetry(): boolean {
    return this._status === 'error' && this._retryCount < MAX_RETRIES;
  }

  getNextRetryDelay(): number {
    if (this._retryCount <= 0 || this._retryCount > MAX_RETRIES) {
      return 0;
    }
    return RETRY_DELAYS[this._retryCount - 1];
  }

  getDeduplicationKey(): string {
    return `${this._platform}:${this._platformOrderId}`;
  }
}
