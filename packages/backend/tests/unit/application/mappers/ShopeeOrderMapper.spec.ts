import { describe, it, expect } from 'vitest';
import { ShopeeOrderMapper } from '@/application/mappers/ShopeeOrderMapper';

describe('ShopeeOrderMapper', () => {
  const validPayloadBase = {
    ordersn: 'SN123456789',
    shop_id: 98765,
    buyer_username: 'João Comprador',
    buyer_email: 'joao@exemplo.com',
    total_amount: 15000,
    item_list: [
      { item_name: 'Cartaz Personalizado', item_count: 3 },
      { item_name: 'Banner A0', item_count: 1 },
    ],
    order_status: 'READY_TO_SHIP',
    create_time: 1714176000,
  };

  describe('Cenário 1: Mapeamento completo com todos os campos', () => {
    it('deve gerar orderNumber no formato ORD-SHOPEE-<ordersn>', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.orderNumber).toBe('ORD-SHOPEE-SN123456789');
    });

    it('deve mapear shopeeOrderId a partir de ordersn', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.shopeeOrderId).toBe('SN123456789');
    });

    it('deve mapear shopeeShopId como string', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.shopeeShopId).toBe('98765');
    });

    it('deve converter total_amount de centavos para BRL', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.totalAmount).toBe(150.0);
    });

    it('deve mapear nome do comprador para customer.name', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.customer.name).toBe('João Comprador');
    });

    it('deve mapear email do comprador para customer.email', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.customer.email).toBe('joao@exemplo.com');
    });

    it('deve mapear status READY_TO_SHIP para scheduled', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.status).toBe('scheduled');
    });

    it('deve converter create_time Unix timestamp para Date', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.createdAt).toEqual(new Date(1714176000 * 1000));
    });

    it('deve retornar lista de warnings vazia quando todos os campos presentes', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Cenário 2: Email ausente → gerado automaticamente', () => {
    it('deve gerar email sintético no formato shopee-<ordersn>@sem-email.local', () => {
      const payload = { ...validPayloadBase, buyer_email: undefined };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.customer.email).toBe('shopee-SN123456789@sem-email.local');
    });

    it('deve registrar aviso contendo o email gerado', () => {
      const payload = { ...validPayloadBase, buyer_email: undefined };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('shopee-SN123456789@sem-email.local');
    });
  });

  describe('Cenário 3: Nome do comprador ausente → erro', () => {
    it('deve lançar erro quando buyer_username ausente', () => {
      const payload = { ...validPayloadBase, buyer_username: undefined };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow('Nome do comprador obrigatório');
    });

    it('deve lançar erro quando buyer_username é string vazia', () => {
      const payload = { ...validPayloadBase, buyer_username: '' };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow('Nome do comprador obrigatório');
    });

    it('deve lançar erro quando buyer_username contém apenas espaços', () => {
      const payload = { ...validPayloadBase, buyer_username: '   ' };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow('Nome do comprador obrigatório');
    });
  });

  describe('Cenário 4: Mapeamento de status Shopee → interno', () => {
    it('deve mapear UNPAID para draft', () => {
      const result = ShopeeOrderMapper.map({ ...validPayloadBase, order_status: 'UNPAID' });
      expect(result.order.status).toBe('draft');
    });

    it('deve mapear SHIPPED para shipping', () => {
      const result = ShopeeOrderMapper.map({ ...validPayloadBase, order_status: 'SHIPPED' });
      expect(result.order.status).toBe('shipping');
    });

    it('deve mapear COMPLETED para completed', () => {
      const result = ShopeeOrderMapper.map({ ...validPayloadBase, order_status: 'COMPLETED' });
      expect(result.order.status).toBe('completed');
    });

    it('deve mapear CANCELLED para cancelled', () => {
      const result = ShopeeOrderMapper.map({ ...validPayloadBase, order_status: 'CANCELLED' });
      expect(result.order.status).toBe('cancelled');
    });

    it('deve usar draft como fallback para status desconhecido', () => {
      const result = ShopeeOrderMapper.map({ ...validPayloadBase, order_status: 'STATUS_NOVO' });
      expect(result.order.status).toBe('draft');
    });

    it('deve usar draft quando order_status ausente', () => {
      const { order_status: _, ...payloadSemStatus } = validPayloadBase;
      const result = ShopeeOrderMapper.map(payloadSemStatus);
      expect(result.order.status).toBe('draft');
    });
  });

  describe('Cenário 5: Itens como texto livre', () => {
    it('deve concatenar itens no formato "Nx Nome, Mx Nome"', () => {
      const result = ShopeeOrderMapper.map(validPayloadBase);
      expect(result.order.description).toBe('3x Cartaz Personalizado, 1x Banner A0');
    });

    it('deve usar descrição de fallback quando item_list está ausente', () => {
      const payload = { ...validPayloadBase, item_list: undefined };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.order.description).toContain('SN123456789');
    });

    it('deve usar descrição de fallback quando item_list está vazio', () => {
      const payload = { ...validPayloadBase, item_list: [] };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.order.description).toContain('SN123456789');
    });

    it('deve formatar item único corretamente', () => {
      const payload = {
        ...validPayloadBase,
        item_list: [{ item_name: 'Lona Impressa', item_count: 2 }],
      };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.order.description).toBe('2x Lona Impressa');
    });
  });

  describe('Validação de campos obrigatórios do payload', () => {
    it('deve lançar erro quando ordersn ausente', () => {
      const payload = { ...validPayloadBase, ordersn: undefined };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow();
    });

    it('deve lançar erro quando total_amount ausente', () => {
      const payload = { ...validPayloadBase, total_amount: undefined };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow();
    });

    it('deve lançar erro quando shop_id ausente', () => {
      const payload = { ...validPayloadBase, shop_id: undefined };
      expect(() => ShopeeOrderMapper.map(payload)).toThrow();
    });

    it('deve aceitar shop_id como string', () => {
      const payload = { ...validPayloadBase, shop_id: '98765' };
      const result = ShopeeOrderMapper.map(payload);
      expect(result.order.shopeeShopId).toBe('98765');
    });

    it('deve usar data atual quando create_time ausente', () => {
      const before = new Date();
      const payload = { ...validPayloadBase, create_time: undefined };
      const result = ShopeeOrderMapper.map(payload);
      const after = new Date();
      expect(result.order.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.order.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
