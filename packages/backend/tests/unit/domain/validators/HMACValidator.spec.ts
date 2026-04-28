import { describe, it, expect } from 'vitest';
import { HMACValidator } from '@/domain/validators/HMACValidator';

describe('HMACValidator', () => {
  const secret = 'test-secret-key';
  const validator = new HMACValidator(secret);

  describe('Validação de assinatura HMAC', () => {
    it('deve validar assinatura HMAC válida', () => {
      const payload = JSON.stringify({ event: 'shop_order:new_order', data: { order_id: 123 } });
      const signature = validator.sign(payload);

      const isValid = validator.validate(payload, signature);

      expect(isValid).toBe(true);
    });

    it('deve rejeitar assinatura HMAC inválida', () => {
      const payload = JSON.stringify({ event: 'shop_order:new_order', data: { order_id: 123 } });
      const invalidSignature = 'invalid-signature';

      const isValid = validator.validate(payload, invalidSignature);

      expect(isValid).toBe(false);
    });

    it('deve rejeitar assinatura se payload for modificado', () => {
      const payload = JSON.stringify({ event: 'shop_order:new_order', data: { order_id: 123 } });
      const signature = validator.sign(payload);
      const modifiedPayload = JSON.stringify({ event: 'shop_order:new_order', data: { order_id: 456 } });

      const isValid = validator.validate(modifiedPayload, signature);

      expect(isValid).toBe(false);
    });

    it('deve ser sensível a diferenças de caso (maiúscula/minúscula)', () => {
      const payload = JSON.stringify({ event: 'test' });
      const signature = validator.sign(payload);
      const modifiedSignature = signature.toUpperCase();

      const isValid = validator.validate(payload, modifiedSignature);

      expect(isValid).toBe(false);
    });

    it('deve rejeitar assinatura vazia', () => {
      const payload = JSON.stringify({ event: 'test' });
      const isValid = validator.validate(payload, '');

      expect(isValid).toBe(false);
    });
  });

  describe('Geração de assinatura', () => {
    it('deve gerar assinatura consistente para mesmo payload', () => {
      const payload = JSON.stringify({ event: 'test', id: 1 });

      const sig1 = validator.sign(payload);
      const sig2 = validator.sign(payload);

      expect(sig1).toBe(sig2);
    });

    it('deve gerar assinatura diferente para payloads diferentes', () => {
      const payload1 = JSON.stringify({ event: 'test', id: 1 });
      const payload2 = JSON.stringify({ event: 'test', id: 2 });

      const sig1 = validator.sign(payload1);
      const sig2 = validator.sign(payload2);

      expect(sig1).not.toBe(sig2);
    });

    it('deve gerar assinatura em hexadecimal', () => {
      const payload = JSON.stringify({ event: 'test' });
      const signature = validator.sign(payload);

      const isHex = /^[a-f0-9]+$/.test(signature);
      expect(isHex).toBe(true);
    });
  });

  describe('Validação com chaves diferentes', () => {
    it('deve rejeitar assinatura feita com chave diferente', () => {
      const secret1 = 'secret-key-1';
      const secret2 = 'secret-key-2';
      const payload = JSON.stringify({ event: 'test' });

      const validator1 = new HMACValidator(secret1);
      const validator2 = new HMACValidator(secret2);

      const signature = validator1.sign(payload);
      const isValid = validator2.validate(payload, signature);

      expect(isValid).toBe(false);
    });
  });
});
