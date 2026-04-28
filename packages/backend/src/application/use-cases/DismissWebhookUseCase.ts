import { DismissWebhookInput, DismissWebhookOutput } from '@/application/dtos/WebhookDTO';

export class DismissWebhookUseCase {
  constructor(private webhookRepository: any) {}

  async execute(input: DismissWebhookInput): Promise<DismissWebhookOutput> {
    const webhook = await this.webhookRepository.findById(input.webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    webhook.markAsDiscarded(input.reason);
    await this.webhookRepository.save(webhook);

    return {
      success: true,
      message: 'Webhook dismissed successfully',
    };
  }
}
