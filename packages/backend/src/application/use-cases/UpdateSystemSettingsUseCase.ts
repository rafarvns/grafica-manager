import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';
import { SystemSettings } from '../../domain/entities/SystemSettings';
import { UpdateSystemSettingsDto, validateCNPJ } from '@grafica/shared';
import { SystemSettingsCache } from '../../infrastructure/cache/SystemSettingsCache';

export class UpdateSystemSettingsUseCase {
  constructor(
    private repository: SystemSettingsRepository,
    private cache: SystemSettingsCache
  ) {}

  async execute(data: UpdateSystemSettingsDto): Promise<SystemSettings> {
    if (data.cnpj && !validateCNPJ(data.cnpj)) {
      throw new Error('CNPJ inválido. Use formato: XX.XXX.XXX/XXXX-XX');
    }

    const updated = await this.repository.upsert(data);
    this.cache.set(updated);
    return updated;
  }
}
