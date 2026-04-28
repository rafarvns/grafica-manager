import { z } from 'zod';

export const ShopeeOrderItemSchema = z.object({
  item_name: z.string(),
  item_count: z.number().int().positive(),
  model_name: z.string().optional(),
});

export const ShopeeOrderPayloadSchema = z.object({
  ordersn: z.string().min(1),
  shop_id: z.union([z.string().min(1), z.number()]),
  buyer_username: z.string().optional(),
  buyer_email: z.string().email().optional(),
  total_amount: z.number().positive(),
  item_list: z.array(ShopeeOrderItemSchema).optional().default([]),
  order_status: z.string().optional().default('UNPAID'),
  create_time: z.number().optional(),
});

export type ShopeeOrderPayload = z.infer<typeof ShopeeOrderPayloadSchema>;
