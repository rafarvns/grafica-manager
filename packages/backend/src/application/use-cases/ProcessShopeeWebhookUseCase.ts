import { HMACValidator } from '@/domain/validators/HMACValidator';
import { ShopeeWebhookEvent, ShopeeWebhookEventType } from '@/domain/entities/ShopeeWebhookEvent';

export interface IWebhookRepository {
  save(event: ShopeeWebhookEvent): Promise<void>;
  findByShopeeOrderId(shopeeOrderId: string): Promise<ShopeeWebhookEvent | null>;
}

export interface IOrderRepository {
  findByShopeeOrderId(shopeeOrderId: string): Promise<any>;
}

export interface ICustomerRepository {
  findByEmail(email: string): Promise<any>;
}

export interface ICreateOrderUseCase {
  execute(input: any): Promise<any>;
}

export interface ICancelOrderUseCase {
  execute(orderId: string, reason: string): Promise<any>;
}

export interface IJobQueue {
  add(jobName: string, data: any, options?: any): Promise<any>;
}

export class ProcessShopeeWebhookUseCase {
  constructor(
    private hmacValidator: HMACValidator,
    private webhookRepository: IWebhookRepository,
    private orderRepository: IOrderRepository,
    private customerRepository: ICustomerRepository,
    private createOrderUseCase: ICreateOrderUseCase,
    private cancelOrderUseCase: ICancelOrderUseCase,
    private jobQueue: IJobQueue
  ) {}

  async execute(input: {
    eventType: string;
    data: any;
    signature: string;
    rawPayload: string;
  }): Promise<{
    status: 'accepted' | 'duplicate' | 'error';
    httpStatus: number;
    message?: string;
  }> {
    // Validar HMAC
    const isValidHmac = this.hmacValidator.validate(input.rawPayload, input.signature);
    if (!isValidHmac) {
      console.warn(`Security: HMAC validation failed for webhook: ${input.eventType}`);
      throw new Error('HMAC validation failed');
    }

    // Validar tipo de evento
    const validEvents: ShopeeWebhookEventType[] = ['shop_order:new_order', 'shop_order:cancelled'];
    if (!validEvents.includes(input.eventType as ShopeeWebhookEventType)) {
      throw new Error(`Invalid event type: ${input.eventType}`);
    }

    // Extrair shopeeOrderId do data
    const shopeeOrderId = input.data.order_id ? String(input.data.order_id) : null;
    if (!shopeeOrderId) {
      throw new Error('order_id not found in webhook data');
    }

    // Verificar duplicação
    const existingEvent = await this.webhookRepository.findByShopeeOrderId(shopeeOrderId);
    if (existingEvent && existingEvent.getStatus() === 'completed') {
      return {
        status: 'duplicate',
        httpStatus: 202,
        message: `Webhook duplicado para pedido Shopee ${shopeeOrderId}`,
      };
    }

    // Criar evento webhook
    const event = ShopeeWebhookEvent.create({
      eventType: input.eventType as ShopeeWebhookEventType,
      shopeeOrderId,
      data: input.data,
    });

    // Salvar evento
    await this.webhookRepository.save(event);

    // Enfileirar processamento assíncrono
    await this.jobQueue.add('process-shopee-webhook', {
      eventId: event.getId(),
      eventType: input.eventType,
      shopeeOrderId,
      data: input.data,
    });

    return {
      status: 'accepted',
      httpStatus: 202,
    };
  }
}
