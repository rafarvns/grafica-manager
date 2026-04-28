import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSystemSettingsUseCase } from '../../../../src/application/use-cases/GetSystemSettingsUseCase';
import { SystemSettingsRepository } from '../../../../src/domain/repositories/SystemSettingsRepository';
import { SystemSettings } from '../../../../src/domain/entities/SystemSettings';

describe('GetSystemSettingsUseCase', () => {
  let repository: SystemSettingsRepository;
  let useCase: GetSystemSettingsUseCase;

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
    useCase = new GetSystemSettingsUseCase(repository, cache);
  });

  it('should return system settings from repository', async () => {
    vi.mocked(repository.find).mockResolvedValue(mockSettings);

    const result = await useCase.execute();

    expect(result).toEqual(mockSettings);
    expect(repository.find).toHaveBeenCalledTimes(1);
  });

  it('should throw error if settings not found', async () => {
    vi.mocked(repository.find).mockResolvedValue(null);

    await expect(useCase.execute()).rejects.toThrow('Configurações do sistema não encontradas');
  });
});
