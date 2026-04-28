import { PrismaClient } from '@prisma/client';
import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';
import { SystemSettings } from '../../domain/entities/SystemSettings';
import { UpdateSystemSettingsDto } from '@grafica/shared';

export class PrismaSystemSettingsRepository implements SystemSettingsRepository {
  constructor(private prisma: PrismaClient) {}

  async find(): Promise<SystemSettings | null> {
    const settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      return null;
    }

    return new SystemSettings({
      id: settings.id,
      name: settings.name,
      cnpj: settings.cnpj,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      address_street: settings.address_street,
      address_number: settings.address_number,
      address_complement: settings.address_complement,
      address_city: settings.address_city,
      address_state: settings.address_state,
      address_zip: settings.address_zip,
      logoPath: settings.logoPath,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  }

  async upsert(data: UpdateSystemSettingsDto): Promise<SystemSettings> {
    // There is only one settings record, so we use a fixed ID or findFirst/create
    const current = await this.prisma.systemSettings.findFirst();

    const settings = await this.prisma.systemSettings.upsert({
      where: {
        id: current?.id || 'default-settings',
      },
      update: {
        ...(data.name && { name: data.name }),
        ...(data.cnpj && { cnpj: data.cnpj }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.address_street && { address_street: data.address_street }),
        ...(data.address_number && { address_number: data.address_number }),
        ...(data.address_complement !== undefined && { address_complement: data.address_complement }),
        ...(data.address_city && { address_city: data.address_city }),
        ...(data.address_state && { address_state: data.address_state }),
        ...(data.address_zip && { address_zip: data.address_zip }),
        ...(data.logoPath !== undefined && { logoPath: data.logoPath }),
      },
      create: {
        id: 'default-settings',
        name: data.name || 'Gráfica Manager',
        cnpj: data.cnpj || '00.000.000/0000-00',
        phone: data.phone || '',
        email: data.email || '',
        address_street: data.address_street || '',
        address_number: data.address_number || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
        address_zip: data.address_zip || '',
        website: data.website ?? null,
        address_complement: data.address_complement ?? null,
        logoPath: data.logoPath ?? null,
      },
    });

    return new SystemSettings({
      ...settings,
      website: settings.website,
      address_complement: settings.address_complement,
      logoPath: settings.logoPath,
    });
  }
}
