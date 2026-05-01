import { OrderStatus } from '@grafica/shared';
import crypto from 'crypto';

export interface OrderProps {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  description: string;
  quantity: number;
  priceTableEntryId?: string | null;
  dueDate?: Date | null;
  shopeeOrderId?: string | null;
  shopeeShopId?: string | null;
  salePrice: number;
  notes?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  storeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Order {
  constructor(private readonly props: OrderProps) {}

  get id() { return this.props.id; }
  get orderNumber() { return this.props.orderNumber; }
  get status() { return this.props.status; }
  get description() { return this.props.description; }
  get quantity() { return this.props.quantity; }
  get priceTableEntryId() { return this.props.priceTableEntryId; }
  get dueDate() { return this.props.dueDate; }
  get shopeeOrderId() { return this.props.shopeeOrderId; }
  get shopeeShopId() { return this.props.shopeeShopId; }
  get salePrice() { return this.props.salePrice; }
  get customerId() { return this.props.customerId; }
  get customerName() { return this.props.customerName; }
  get storeId() { return this.props.storeId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get deletedAt() { return this.props.deletedAt; }

  static create(props: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Order {
    const now = new Date();
    return new Order({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  changeStatus(newStatus: OrderStatus): { fromStatus: OrderStatus; toStatus: OrderStatus } {
    const validStatuses: OrderStatus[] = ['draft', 'scheduled', 'in_production', 'completed', 'shipping', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Status inválido');
    }

    if (this.props.status === newStatus) {
      throw new Error(`Pedido já está em status ${newStatus}`);
    }

    if (this.props.status === 'cancelled') {
      throw new Error('Pedido cancelado não pode mudar de status');
    }

    if (this.props.status === 'shipping') {
      throw new Error('Pedido em shipping não pode mudar de status');
    }

    const fromStatus = this.props.status;
    (this.props as any).status = newStatus;
    (this.props as any).updatedAt = new Date();

    return { fromStatus, toStatus: newStatus };
  }

  update(props: {
    description?: string | undefined;
    quantity?: number | undefined;
    priceTableEntryId?: string | null | undefined;
    dueDate?: Date | null | undefined;
    salePrice?: number | undefined;
    notes?: string | null | undefined;
  }) {
    if (this.props.status === 'shipping') {
      throw new Error('Pedido em shipping não pode ser editado');
    }

    if (this.props.status === 'cancelled') {
      throw new Error('Pedido cancelado não pode ser editado');
    }

    if (props.quantity !== undefined) {
      if (props.quantity <= 0) throw new Error('Quantidade deve ser maior que 0');
      (this.props as any).quantity = props.quantity;
    }

    if (props.salePrice !== undefined) {
      if (props.salePrice < 0) throw new Error('Preço de venda não pode ser negativo');
      (this.props as any).salePrice = props.salePrice;
    }

    if (props.description !== undefined) (this.props as any).description = props.description.trim();
    if (props.priceTableEntryId !== undefined) (this.props as any).priceTableEntryId = props.priceTableEntryId;
    if (props.dueDate !== undefined) (this.props as any).dueDate = props.dueDate;
    if (props.notes !== undefined) (this.props as any).notes = props.notes;

    (this.props as any).updatedAt = new Date();
  }

  cancel(reason: string): { fromStatus: OrderStatus; toStatus: OrderStatus; reason: string } {
    if (this.props.status === 'cancelled') {
      throw new Error('Pedido já está cancelado');
    }

    const fromStatus = this.props.status;
    (this.props as any).status = 'cancelled';
    (this.props as any).cancellationReason = reason;
    (this.props as any).updatedAt = new Date();

    return { fromStatus, toStatus: 'cancelled', reason };
  }

  softDelete() {
    (this.props as any).deletedAt = new Date();
    (this.props as any).updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
