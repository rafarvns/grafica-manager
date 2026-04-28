import { SystemSettings } from '../../domain/entities/SystemSettings';

export class SystemSettingsCache {
  private static instance: SystemSettingsCache;
  private cachedSettings: SystemSettings | null = null;

  private constructor() {}

  static getInstance(): SystemSettingsCache {
    if (!SystemSettingsCache.instance) {
      SystemSettingsCache.instance = new SystemSettingsCache();
    }
    return SystemSettingsCache.instance;
  }

  get(): SystemSettings | null {
    return this.cachedSettings;
  }

  set(settings: SystemSettings): void {
    this.cachedSettings = settings;
  }

  invalidate(): void {
    this.cachedSettings = null;
  }
}
