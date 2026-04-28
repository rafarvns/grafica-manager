import crypto from 'crypto';

export interface PaperTypeProps {
  id: string;
  name: string;
  gsm?: number | null;
  size?: string | null;
  color?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class PaperType {
  constructor(private readonly props: PaperTypeProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get gsm() { return this.props.gsm; }
  get size() { return this.props.size; }
  get color() { return this.props.color; }
  get active() { return this.props.active; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get deletedAt() { return this.props.deletedAt; }

  static create(props: Omit<PaperTypeProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): PaperType {
    const now = new Date();
    return new PaperType({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  toJSON() {
    return { ...this.props };
  }
}
