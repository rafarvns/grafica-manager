export type ShopeeConnectionStatus = 'Ativo' | 'Inativo' | 'Erro de autenticação' | 'Token expirado';

export type WebhookStatus = 'pending' | 'processed' | 'error';

export interface ShopeeStatus {
  isActive: boolean;
  tokenConfigured: boolean;
  lastWebhookTime?: string;
  successRate: number; // 0-100
  queuedWebhooks: number;
  connectionError?: string;
  maskedToken?: string;
}

export interface WebhookEvent {
  id: string;
  timestamp: string;
  status: WebhookStatus;
  eventType: string;
  shopeeOrderId: string;
  payload: any;
  result?: string;
  errorDetails?: {
    type: string;
    message: string;
    stacktrace?: string;
    attempts: number;
    lastAttempt: string;
  };
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  webhookId?: string;
  stacktrace?: string;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  processedOrders: number;
  failedOrders: number;
  duration: string;
  details?: string;
}

export interface SyncJobStatus {
  id: string;
  active: boolean;
  progress: number;
  processed: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface WebhooksPagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface WebhooksFilters {
  startDate?: string;
  endDate?: string;
  status?: WebhookStatus;
  eventType?: string;
}
