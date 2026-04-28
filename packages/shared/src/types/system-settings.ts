export interface SystemSettings {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  website?: string | null;
  address_street: string;
  address_number: string;
  address_complement?: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  logoPath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateSystemSettingsDto = Partial<Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>>;
