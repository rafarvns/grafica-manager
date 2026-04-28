export type InternalOrderStatus = 'draft' | 'scheduled' | 'shipping' | 'completed' | 'cancelled';

const STATUS_MAP: Record<string, InternalOrderStatus> = {
  UNPAID: 'draft',
  READY_TO_SHIP: 'scheduled',
  SHIPPED: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export class ShopeeStatusMapper {
  static map(shopeeStatus: string): InternalOrderStatus {
    return STATUS_MAP[shopeeStatus] ?? 'draft';
  }
}
