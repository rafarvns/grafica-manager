export interface ProcessWebhookInput {
  eventType: string;
  data: any;
  signature: string;
  rawPayload: string;
}

export interface ProcessWebhookOutput {
  status: 'accepted' | 'duplicate' | 'error';
  httpStatus: number;
  message?: string;
}

export interface SyncOrdersInput {
  since?: Date;
}

export interface SyncOrdersOutput {
  totalOrders: number;
  newOrders: number;
  skippedDuplicates: number;
  lastSyncAt: Date;
}

export interface ShopeeConfigOutput {
  integrationEnabled: boolean;
  hasValidToken: boolean;
  lastSyncAt?: Date;
  queueHealthy: boolean;
  lastWebhookAt?: Date;
}

export interface UpdateShopeeConfigInput {
  enabled?: boolean;
}
