import { describe, it, expect } from 'vitest';
import { SystemSettings } from '../../../src/domain/entities/SystemSettings';

describe('SystemSettings Entity', () => {
  const validData = {
    id: '123',
    name: 'Gráfica Manager',
    cnpj: '00.000.000/0000-00',
    phone: '(11) 99999-9999',
    email: 'contato@grafica.com',
    address_street: 'Rua Exemplo',
    address_number: '123',
    address_city: 'São Paulo',
    address_state: 'SP',
    address_zip: '00000-000',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should create a valid SystemSettings instance', () => {
    const settings = new SystemSettings(validData);
    expect(settings.name).toBe(validData.name);
    expect(settings.cnpj).toBe(validData.cnpj);
  });

  it('should throw error if CNPJ is invalid', () => {
    expect(() => new SystemSettings({ ...validData, cnpj: 'invalid' }))
      .toThrow('CNPJ inválido');
  });
});
