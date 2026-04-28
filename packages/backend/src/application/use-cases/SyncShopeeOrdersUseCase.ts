export interface IShopeeApiAdapter {
  getOrders(options?: any): Promise<any[]>;
}

export interface IOrderRepository {
  findByShopeeOrderId(shopeeOrderId: string): Promise<any>;
}

export interface IJobQueue {
  add(jobName: string, data: any, options?: any): Promise<any>;
}

export class SyncShopeeOrdersUseCase {
  constructor(
    private shopeeApiAdapter: IShopeeApiAdapter,
    private orderRepository: IOrderRepository,
    private jobQueue: IJobQueue
  ) {}

  async execute(input: {
    since?: Date;
  }): Promise<{
    totalOrders: number;
    newOrders: number;
    skippedDuplicates: number;
    lastSyncAt: Date;
  }> {
    const lastSyncAt = new Date();

    try {
      // Buscar pedidos da API Shopee
      const orders = await this.shopeeApiAdapter.getOrders({
        since: input.since,
      });

      let newOrders = 0;
      let skippedDuplicates = 0;

      // Processar cada pedido
      for (const order of orders) {
        const shopeeOrderId = String(order.order_id);
        const existingOrder = await this.orderRepository.findByShopeeOrderId(shopeeOrderId);

        if (existingOrder) {
          skippedDuplicates++;
          continue;
        }

        // Enfileirar para processamento
        try {
          await this.jobQueue.add('process-shopee-webhook', {
            eventType: 'shop_order:new_order',
            shopeeOrderId,
            data: order,
          });
          newOrders++;
        } catch (err) {
          console.error(`Failed to enqueue Shopee order ${shopeeOrderId}:`, err);
        }
      }

      return {
        totalOrders: orders.length,
        newOrders,
        skippedDuplicates,
        lastSyncAt,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
