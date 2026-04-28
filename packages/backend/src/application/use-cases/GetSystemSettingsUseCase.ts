import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';
import { SystemSettings } from '../../domain/entities/SystemSettings';
import { SystemSettingsCache } from '../../infrastructure/cache/SystemSettingsCache';

export class GetSystemSettingsUseCase {
  constructor(
    private repository: SystemSettingsRepository,
    private cache: SystemSettingsCache
  ) {}

  async execute(): Promise<SystemSettings> {
    const cached = this.cache.get();
    if (cached) return cached;

    const settings = await this.repository.find();

    if (!settings) {
      throw new Error('Configurações do sistema não encontradas');
    }

    this.cache.set(settings);
    return settings;
  }
}
