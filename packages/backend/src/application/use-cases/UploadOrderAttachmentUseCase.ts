import { OrderAttachment } from '../../domain/entities/OrderAttachment';
import { OrderAttachmentRepository } from '../../domain/repositories/OrderAttachmentRepository';
import { FileStorage } from '../ports/FileStorage';
import { FileTooLargeError, InvalidMimeTypeError } from '../../domain/errors/file-storage-errors';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadOrderAttachmentInput {
  orderId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

export class UploadOrderAttachmentUseCase {
  constructor(
    private repository: OrderAttachmentRepository,
    private fileStorage: FileStorage
  ) {}

  async execute(input: UploadOrderAttachmentInput): Promise<OrderAttachment> {
    const { orderId, file } = input;

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      throw new FileTooLargeError(10);
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new InvalidMimeTypeError(ALLOWED_TYPES);
    }

    // Upload para storage
    const filepath = await this.fileStorage.upload(orderId, file);

    // Criar entidade
    const attachment = new OrderAttachment({
      orderId,
      filename: filepath.split('/').pop() || '',
      originalFilename: file.originalname,
      filepath,
      size: file.size,
      mimeType: file.mimetype,
    });

    // Salvar no repositório
    await this.repository.save(attachment);

    return attachment;
  }
}
