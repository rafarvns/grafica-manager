import { SystemSettings } from '../entities/SystemSettings';
import { UpdateSystemSettingsDto } from '@grafica/shared';

export interface SystemSettingsRepository {
  find(): Promise<SystemSettings | null>;
  upsert(data: UpdateSystemSettingsDto): Promise<SystemSettings>;
}
