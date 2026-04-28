import { WebhookEvent } from '@/domain/entities/WebhookEvent';

export interface ReceiveWebhookInput {
  platform: string;
  data: any;
  signature: string;
  rawPayload: string;
}

export interface ReceiveWebhookOutput {
  status: 'accepted' | 'duplicate';
  httpStatus: 202;
}

export class ReceiveWebhookUseCase {
  constructor(
    private hmacValidator: any,
    private webhookRepository: any,
    private jobQueue: any
  ) {}

  async execute(input: ReceiveWebhookInput): Promise<ReceiveWebhookOutput> {
    // Validate HMAC signature
    const isValid = this.hmacValidator.validate(input.rawPayload, input.signature);
    if (!isValid) {
      console.warn(`HMAC validation failed for platform: ${input.platform}`);
      throw new Error('HMAC validation failed');
    }

    // Extract order ID for deduplication
    const platformOrderId = String(input.data.order_id);

    // Check for duplicate webhook
    const deduplicationKey = `${input.platform}:${platformOrderId}`;
    const existingWebhook = await this.webhookRepository.findByDeduplicationKey(deduplicationKey);

    if (existingWebhook?.status === 'processed') {
      return {
        status: 'duplicate',
        httpStatus: 202,
      };
    }

    // Create webhook event entity
    const webhook = WebhookEvent.create({
      platform: input.platform,
      platformOrderId,
      payload: input.data,
      rawPayload: input.rawPayload,
    });

    // Persist webhook for audit trail
    await this.webhookRepository.save(webhook);

    // Enqueue async processing job
    await this.jobQueue.add('process-webhook', {
      platform: input.platform,
      webhookId: webhook.getId(),
      platformOrderId,
      data: input.data,
    });

    // Return 202 Accepted immediately
    return {
      status: 'accepted',
      httpStatus: 202,
    };
  }
}
