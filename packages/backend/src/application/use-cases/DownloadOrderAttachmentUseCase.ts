import { OrderAttachmentRepository } from '../../domain/repositories/OrderAttachmentRepository';
import { FileStorage } from '../ports/FileStorage';
import { FileNotFoundError } from '../../domain/errors/file-storage-errors';

export interface DownloadOrderAttachmentOutput {
  stream: NodeJS.ReadableStream;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export class DownloadOrderAttachmentUseCase {
  constructor(
    private repository: OrderAttachmentRepository,
    private fileStorage: FileStorage
  ) {}

  async execute(id: string): Promise<DownloadOrderAttachmentOutput> {
    const attachment = await this.repository.findById(id);

    if (!attachment || attachment.isDeleted()) {
      throw new FileNotFoundError();
    }

    const stream = await this.fileStorage.download(attachment.filepath);

    return {
      stream,
      originalFilename: attachment.originalFilename,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }
}
