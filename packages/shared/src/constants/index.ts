export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  PRODUCTION_DONE = 'PRODUCTION_DONE',
  PACKAGED = 'PACKAGED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

export enum PrintQuality {
  DRAFT = 'DRAFT',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export enum ColorProfile {
  CMYK = 'CMYK',
  RGB = 'RGB',
  GRAYSCALE = 'GRAYSCALE',
}

export enum StoreSource {
  SHOPEE = 'SHOPEE',
  MERCADO_LIVRE = 'MERCADO_LIVRE',
  MANUAL = 'MANUAL',
}

// Ordem das transições válidas de status de pedido
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.RECEIVED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.PRODUCTION_DONE,
  OrderStatus.PACKAGED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
