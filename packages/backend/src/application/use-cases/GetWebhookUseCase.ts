import { GetWebhookInput, WebhookEventOutput } from '@/application/dtos/WebhookDTO';

export class GetWebhookUseCase {
  constructor(private webhookRepository: any) {}

  async execute(input: GetWebhookInput): Promise<WebhookEventOutput> {
    const webhook = await this.webhookRepository.findById(input.webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return {
      id: webhook.getId ? webhook.getId() : webhook.id,
      platform: webhook.platform,
      platformOrderId: webhook.platformOrderId,
      status: webhook.status,
      retryCount: webhook.retryCount,
      lastError: webhook.lastError,
      discardReason: webhook.discardReason,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      payload: webhook.payload,
    } as any;
  }
}
