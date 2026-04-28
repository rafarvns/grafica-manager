export interface ProcessWebhookJobInput {
  webhookId: string;
  platform: string;
  platformOrderId: string;
  data: any;
}

export class ProcessWebhookJobUseCase {
  constructor(
    private webhookRepository: any,
    private platformHandlers: Record<string, (input: any) => Promise<void>>
  ) {}

  async execute(input: ProcessWebhookJobInput): Promise<void> {
    // Get handler for platform (fail fast)
    const handler = this.platformHandlers[input.platform];
    if (!handler) {
      throw new Error(`Handler not found for platform: ${input.platform}`);
    }

    // Load webhook event from repository
    const webhook = await this.webhookRepository.findById(input.webhookId);

    // Mark as processing
    webhook.markAsProcessing();

    try {
      // Call platform-specific handler
      await handler({
        webhookId: input.webhookId,
        platformOrderId: input.platformOrderId,
        data: input.data,
      });

      // Mark as processed on success
      webhook.markAsProcessed();
    } catch (error) {
      // Mark as error on failure
      const errorMessage = error instanceof Error ? error.message : String(error);
      webhook.markAsError(errorMessage);

      // Save webhook in error state before rethrowing
      await this.webhookRepository.save(webhook);

      // Rethrow for queue to handle retry logic
      throw error;
    }

    // Save updated webhook
    await this.webhookRepository.save(webhook);
  }
}
