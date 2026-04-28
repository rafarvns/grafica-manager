export interface OrderAttachmentProps {
  id?: string;
  orderId: string;
  filename: string;
  originalFilename: string;
  filepath: string;
  size: number;
  mimeType: string;
  uploadedAt?: Date;
  deletedAt?: Date | null;
}

export class OrderAttachment {
  private props: Required<OrderAttachmentProps>;

  constructor(props: OrderAttachmentProps) {
    this.props = {
      id: props.id || crypto.randomUUID(),
      orderId: props.orderId,
      filename: props.filename,
      originalFilename: props.originalFilename,
      filepath: props.filepath,
      size: props.size,
      mimeType: props.mimeType,
      uploadedAt: props.uploadedAt || new Date(),
      deletedAt: props.deletedAt || null,
    };
  }

  get id() { return this.props.id; }
  get orderId() { return this.props.orderId; }
  get filename() { return this.props.filename; }
  get originalFilename() { return this.props.originalFilename; }
  get filepath() { return this.props.filepath; }
  get size() { return this.props.size; }
  get mimeType() { return this.props.mimeType; }
  get uploadedAt() { return this.props.uploadedAt; }
  get deletedAt() { return this.props.deletedAt; }

  isDeleted() {
    return this.props.deletedAt !== null;
  }

  softDelete() {
    this.props.deletedAt = new Date();
  }

  toJSON() {
    return {
      ...this.props
    };
  }
}
