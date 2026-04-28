import crypto from 'crypto';
import { PrintQuality, ColorProfile } from '@grafica/shared';

export interface PrintJobProps {
  id: string;
  orderId?: string | null;
  printerId: string;
  presetId?: string | null;
  quality: PrintQuality;
  colorProfile: ColorProfile;
  paperTypeId?: string | null;
  paperType?: string | null;
  paperWeight: number;
  pagesBlackAndWhite: number;
  pagesColor: number;
  registeredCost: number;
  status: string; // 'success' | 'error' | 'cancelled'
  errorMessage?: string | null;
  printedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PrintJob {
  constructor(private readonly props: PrintJobProps) {}

  get id() { return this.props.id; }
  get orderId() { return this.props.orderId; }
  get printerId() { return this.props.printerId; }
  get presetId() { return this.props.presetId; }
  get quality() { return this.props.quality; }
  get colorProfile() { return this.props.colorProfile; }
  get paperTypeId() { return this.props.paperTypeId; }
  get paperType() { return this.props.paperType; }
  get paperWeight() { return this.props.paperWeight; }
  get pagesBlackAndWhite() { return this.props.pagesBlackAndWhite; }
  get pagesColor() { return this.props.pagesColor; }
  get registeredCost() { return this.props.registeredCost; }
  get status() { return this.props.status; }
  get errorMessage() { return this.props.errorMessage; }
  get printedAt() { return this.props.printedAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  static create(props: Omit<PrintJobProps, 'id' | 'createdAt' | 'updatedAt' | 'printedAt'> & { id?: string }): PrintJob {
    const now = new Date();
    return new PrintJob({
      ...props,
      id: props.id || crypto.randomUUID(),
      printedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  toJSON() {
    return { ...this.props };
  }
}
