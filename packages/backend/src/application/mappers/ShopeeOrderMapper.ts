import { ShopeeOrderPayloadSchema } from '@/application/validators/ShopeeOrderValidator';
import { ShopeeStatusMapper, InternalOrderStatus } from '@/domain/services/ShopeeStatusMapper';

export interface MappedOrder {
  orderNumber: string;
  shopeeOrderId: string;
  shopeeShopId: string;
  description: string;
  totalAmount: number;
  status: InternalOrderStatus;
  createdAt: Date;
}

export interface MappedCustomer {
  name: string;
  email: string;
}

export interface ShopeeOrderMappingResult {
  order: MappedOrder;
  customer: MappedCustomer;
  warnings: string[];
}

export class ShopeeOrderMapper {
  static map(rawPayload: unknown): ShopeeOrderMappingResult {
    const parseResult = ShopeeOrderPayloadSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      throw new Error(`Payload Shopee inválido: ${parseResult.error.message}`);
    }

    const data = parseResult.data;
    const warnings: string[] = [];

    if (!data.buyer_username || data.buyer_username.trim() === '') {
      throw new Error('Nome do comprador obrigatório');
    }

    let email = data.buyer_email;
    if (!email) {
      email = `shopee-${data.ordersn}@sem-email.local`;
      warnings.push(`Email do comprador ausente. Gerado automaticamente: ${email}`);
    }

    const itemList = data.item_list ?? [];
    const description =
      itemList.length > 0
        ? itemList.map((item) => `${item.item_count}x ${item.item_name}`).join(', ')
        : `Shopee Order ${data.ordersn}`;

    const status = ShopeeStatusMapper.map(data.order_status ?? 'UNPAID');

    const createdAt = data.create_time ? new Date(data.create_time * 1000) : new Date();

    return {
      order: {
        orderNumber: `ORD-SHOPEE-${data.ordersn}`,
        shopeeOrderId: data.ordersn,
        shopeeShopId: String(data.shop_id),
        description,
        totalAmount: data.total_amount / 100,
        status,
        createdAt,
      },
      customer: {
        name: data.buyer_username,
        email,
      },
      warnings,
    };
  }
}
