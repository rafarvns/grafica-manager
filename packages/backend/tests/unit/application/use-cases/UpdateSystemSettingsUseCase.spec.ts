import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSystemSettingsUseCase } from '../../../../src/application/use-cases/UpdateSystemSettingsUseCase';
import { SystemSettingsRepository } from '../../../../src/domain/repositories/SystemSettingsRepository';
import { SystemSettings } from '../../../../src/domain/entities/SystemSettings';
import { UpdateSystemSettingsDto } from '@grafica/shared';

describe('UpdateSystemSettingsUseCase', () => {
  let repository: SystemSettingsRepository;
  let useCase: UpdateSystemSettingsUseCase;

  const mockSettings = new SystemSettings({
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
  });

  beforeEach(() => {
    repository = {
      find: vi.fn(),
      upsert: vi.fn()
    } as any;
    const cache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn()
    } as any;
    useCase = new UpdateSystemSettingsUseCase(repository, cache);
  });

  it('should update system settings and return updated instance', async () => {
    const updateData: UpdateSystemSettingsDto = { name: 'Nova Gráfica' };
    const updatedSettings = new SystemSettings({ ...mockSettings, ...updateData });
    
    vi.mocked(repository.upsert).mockResolvedValue(updatedSettings);

    const result = await useCase.execute(updateData);

    expect(result).toEqual(updatedSettings);
    expect(repository.upsert).toHaveBeenCalledWith(updateData);
    expect(repository.upsert).toHaveBeenCalledTimes(1);
  });

  it('should throw error if update fails validation in entity', async () => {
    const updateData: UpdateSystemSettingsDto = { cnpj: 'invalid' };
    
    // The use case should try to create a temporary entity or just pass to repo which might fail,
    // but usually use cases should validate before calling repo.
    
    await expect(useCase.execute(updateData)).rejects.toThrow();
  });
});
