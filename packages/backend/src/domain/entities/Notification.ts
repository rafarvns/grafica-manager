export type NotificationType = 
  | 'webhook_failed' 
  | 'order_deadline' 
  | 'printer_offline' 
  | 'shopee_sync_failed' 
  | 'disk_full' 
  | 'generic';

export type NotificationCategory = 'critical' | 'warning' | 'info';

export interface NotificationProps {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  dismissedAt?: Date | null;
  orderId?: string | null;
  webhookId?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  constructor(private readonly props: NotificationProps) {}

  get id() { return this.props.id; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get type() { return this.props.type; }
  get category() { return this.props.category; }
  get read() { return this.props.read; }
  get dismissedAt() { return this.props.dismissedAt; }
  get orderId() { return this.props.orderId; }
  get webhookId() { return this.props.webhookId; }
  get actionUrl() { return this.props.actionUrl; }
  get actionLabel() { return this.props.actionLabel; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  static create(props: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt' | 'read' | 'dismissedAt'> & { id?: string }): Notification {
    const now = new Date();
    return new Notification({
      ...props,
      id: props.id || crypto.randomUUID(),
      read: false,
      dismissedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  markAsRead() {
    (this.props as any).read = true;
    (this.props as any).updatedAt = new Date();
  }

  dismiss() {
    (this.props as any).dismissedAt = new Date();
    (this.props as any).updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
