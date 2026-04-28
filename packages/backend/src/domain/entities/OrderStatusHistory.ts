import crypto from 'crypto';

export interface OrderStatusHistoryProps {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string | null;
  createdAt: Date;
}

export class OrderStatusHistory {
  constructor(private readonly props: OrderStatusHistoryProps) {}

  get id() { return this.props.id; }
  get orderId() { return this.props.orderId; }
  get fromStatus() { return this.props.fromStatus; }
  get toStatus() { return this.props.toStatus; }
  get reason() { return this.props.reason; }
  get createdAt() { return this.props.createdAt; }

  static create(props: Omit<OrderStatusHistoryProps, 'id' | 'createdAt'> & { id?: string }): OrderStatusHistory {
    return new OrderStatusHistory({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  toJSON() {
    return { ...this.props };
  }
}
