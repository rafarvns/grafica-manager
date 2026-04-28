import crypto from 'crypto';

export interface CustomerProps {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  externalId?: string | null;
  storeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Customer {
  constructor(private readonly props: CustomerProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get phone() { return this.props.phone; }
  get address() { return this.props.address; }
  get city() { return this.props.city; }
  get state() { return this.props.state; }
  get zipCode() { return this.props.zipCode; }
  get notes() { return this.props.notes; }
  get externalId() { return this.props.externalId; }
  get storeId() { return this.props.storeId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get deletedAt() { return this.props.deletedAt; }

  static create(props: Omit<CustomerProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Customer {
    const now = new Date();
    return new Customer({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  softDelete() {
    (this.props as any).deletedAt = new Date();
    (this.props as any).updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
