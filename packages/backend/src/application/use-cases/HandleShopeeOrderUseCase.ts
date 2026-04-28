import { ShopeeWebhookEvent } from '@/domain/entities/ShopeeWebhookEvent';

export interface IWebhookRepository {
  findByShopeeOrderId(shopeeOrderId: string): Promise<ShopeeWebhookEvent | null>;
  save(event: ShopeeWebhookEvent): Promise<void>;
}

export interface IOrderRepository {
  findByShopeeOrderId(shopeeOrderId: string): Promise<any>;
}

export interface ICustomerRepository {
  findByEmail(email: string): Promise<any>;
  save(customer: any): Promise<any>;
}

export interface ICreateOrderUseCase {
  execute(input: any): Promise<any>;
}

export interface ICancelOrderUseCase {
  execute(orderId: string, reason: string): Promise<any>;
}

export class HandleShopeeOrderUseCase {
  constructor(
    private webhookRepository: IWebhookRepository,
    private orderRepository: IOrderRepository,
    private customerRepository: ICustomerRepository,
    private createOrderUseCase: ICreateOrderUseCase,
    private cancelOrderUseCase: ICancelOrderUseCase
  ) {}

  async execute(input: {
    eventId: string;
    eventType: string;
    shopeeOrderId: string;
    data: any;
  }): Promise<void> {
    let event: any = null;
    try {
      event = await this.webhookRepository.findByShopeeOrderId(input.shopeeOrderId);
      if (!event) {
        throw new Error(`Event not found: ${input.eventId}`);
      }

      event.markAsProcessing();

      if (input.eventType === 'shop_order:new_order') {
        await this.handleNewOrder(input.data, event);
      } else if (input.eventType === 'shop_order:cancelled') {
        await this.handleCancelledOrder(input.data, event);
      }

      event.markAsCompleted();
    } catch (error) {
      if (event) {
        event.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
        await this.webhookRepository.save(event);
      }
      throw error;
    }
  }

  private async handleNewOrder(data: any, event: ShopeeWebhookEvent): Promise<void> {
    // Verificar idempotência: se pedido já existe, não criar novamente
    const existingOrder = await this.orderRepository.findByShopeeOrderId(String(data.order_id));
    if (existingOrder) {
      return;
    }

    // Encontrar ou criar cliente
    const buyerEmail = data.buyer_email || `shopee-buyer-${data.buyer_id}@shopee.local`;
    let customer = await this.customerRepository.findByEmail(buyerEmail);

    if (!customer) {
      customer = await this.customerRepository.save({
        name: data.buyer_name || `Shopee Buyer ${data.buyer_id}`,
        email: buyerEmail,
        phone: null,
        address: null,
        city: null,
        notes: `Imported from Shopee (buyer_id: ${data.buyer_id})`,
      });
    }

    // Criar pedido interno com status "agendado"
    await this.createOrderUseCase.execute({
      customerId: customer.id,
      orderNumber: `SHOPEE-${data.order_sn || data.order_id}`,
      description: `Shopee Order #${data.order_id}`,
      quantity: 1,
      salePrice: data.total_amount / 100, // Shopee usa centavos
      status: 'scheduled',
      shopeeOrderId: String(data.order_id),
    });
  }

  private async handleCancelledOrder(data: any, event: ShopeeWebhookEvent): Promise<void> {
    const order = await this.orderRepository.findByShopeeOrderId(String(data.order_id));
    if (!order) {
      return;
    }

    await this.cancelOrderUseCase.execute(order.id, 'Cancelado via Shopee');
  }
}
