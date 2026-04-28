import { validateCNPJ } from '@grafica/shared';

export interface SystemSettingsProps {
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

export class SystemSettings {
  public readonly id: string;
  public readonly name: string;
  public readonly cnpj: string;
  public readonly phone: string;
  public readonly email: string;
  public readonly website: string | null;
  public readonly address_street: string;
  public readonly address_number: string;
  public readonly address_complement: string | null;
  public readonly address_city: string;
  public readonly address_state: string;
  public readonly address_zip: string;
  public readonly logoPath: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: SystemSettingsProps) {
    if (!validateCNPJ(props.cnpj)) {
      throw new Error('CNPJ inválido. Use formato: XX.XXX.XXX/XXXX-XX');
    }

    this.id = props.id;
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.phone = props.phone;
    this.email = props.email;
    this.website = props.website ?? null;
    this.address_street = props.address_street;
    this.address_number = props.address_number;
    this.address_complement = props.address_complement ?? null;
    this.address_city = props.address_city;
    this.address_state = props.address_state;
    this.address_zip = props.address_zip;
    this.logoPath = props.logoPath ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
