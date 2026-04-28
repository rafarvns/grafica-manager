import { describe, it, expect } from 'vitest';
import { ShopeeStatusMapper } from '@/domain/services/ShopeeStatusMapper';

describe('ShopeeStatusMapper', () => {
  describe('Mapeamento de status Shopee → status interno', () => {
    it('deve mapear UNPAID para draft', () => {
      expect(ShopeeStatusMapper.map('UNPAID')).toBe('draft');
    });

    it('deve mapear READY_TO_SHIP para scheduled', () => {
      expect(ShopeeStatusMapper.map('READY_TO_SHIP')).toBe('scheduled');
    });

    it('deve mapear SHIPPED para shipping', () => {
      expect(ShopeeStatusMapper.map('SHIPPED')).toBe('shipping');
    });

    it('deve mapear COMPLETED para completed', () => {
      expect(ShopeeStatusMapper.map('COMPLETED')).toBe('completed');
    });

    it('deve mapear CANCELLED para cancelled', () => {
      expect(ShopeeStatusMapper.map('CANCELLED')).toBe('cancelled');
    });

    it('deve mapear status desconhecido para draft (placeholder)', () => {
      expect(ShopeeStatusMapper.map('UNKNOWN_STATUS')).toBe('draft');
    });

    it('deve mapear string vazia para draft', () => {
      expect(ShopeeStatusMapper.map('')).toBe('draft');
    });
  });
});
