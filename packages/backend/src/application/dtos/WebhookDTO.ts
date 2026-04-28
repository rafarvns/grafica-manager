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

export interface WebhookEventOutput {
  id: string;
  platform: string;
  platformOrderId: string;
  status: 'pending' | 'processing' | 'processed' | 'error' | 'discarded';
  retryCount: number;
  lastError?: string | null;
  discardReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListWebhooksInput {
  platform?: string;
  status?: 'pending' | 'processing' | 'processed' | 'error' | 'discarded';
  limit?: number;
  offset?: number;
}

export interface ListWebhooksOutput {
  items: WebhookEventOutput[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetWebhookInput {
  webhookId: string;
}

export interface RetryWebhookInput {
  webhookId: string;
}

export interface RetryWebhookOutput {
  success: boolean;
  message: string;
}

export interface DismissWebhookInput {
  webhookId: string;
  reason: string;
}

export interface DismissWebhookOutput {
  success: boolean;
  message: string;
}
