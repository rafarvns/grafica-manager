import { ListWebhooksInput, ListWebhooksOutput, WebhookEventOutput } from '@/application/dtos/WebhookDTO';

export class ListWebhooksUseCase {
  constructor(private webhookRepository: any) {}

  async execute(input: ListWebhooksInput): Promise<ListWebhooksOutput> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const webhooks = await this.webhookRepository.list({
      platform: input.platform,
      status: input.status,
      limit,
      offset,
    });

    const total = await this.webhookRepository.count({
      platform: input.platform,
      status: input.status,
    });

    return {
      items: webhooks.map(this.mapWebhookToOutput),
      total,
      limit,
      offset,
    };
  }

  private mapWebhookToOutput(webhook: any): WebhookEventOutput {
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
    };
  }
}
