import { RetryWebhookInput, RetryWebhookOutput } from '@/application/dtos/WebhookDTO';

export class RetryWebhookUseCase {
  constructor(
    private webhookRepository: any,
    private jobQueue: any
  ) {}

  async execute(input: RetryWebhookInput): Promise<RetryWebhookOutput> {
    const webhook = await this.webhookRepository.findById(input.webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.canRetry()) {
      throw new Error('Max retries exceeded');
    }

    // Mark for reprocessing
    webhook.markAsProcessing();

    // Enqueue job
    await this.jobQueue.add('process-webhook', {
      webhookId: webhook.getId(),
      platform: webhook.platform,
      platformOrderId: webhook.platformOrderId,
      data: webhook.payload,
    });

    // Save updated state
    await this.webhookRepository.save(webhook);

    return {
      success: true,
      message: 'Webhook enqueued for reprocessing',
    };
  }
}
