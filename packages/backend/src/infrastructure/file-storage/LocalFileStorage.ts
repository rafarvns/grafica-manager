import fs from 'fs/promises';
import { createReadStream, ReadStream } from 'fs';
import path from 'path';
import { FileStorage } from '../../application/ports/FileStorage';
import { fileTypeFromBuffer } from 'file-type';
import { InvalidMimeTypeError } from '../../domain/errors/file-storage-errors';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif'
];

export class LocalFileStorage implements FileStorage {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.FILE_STORAGE_PATH || path.resolve(process.cwd(), 'uploads');
  }

  async upload(orderId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<string> {
    // Validar MIME type real pelo buffer
    const type = await fileTypeFromBuffer(file.buffer);
    const mime = type?.mime || file.mimetype;

    if (!ALLOWED_TYPES.includes(mime)) {
      throw new InvalidMimeTypeError(ALLOWED_TYPES);
    }

    const orderPath = path.join(this.basePath, 'orders', orderId);
    await fs.mkdir(orderPath, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(orderPath, filename);

    await fs.writeFile(filepath, file.buffer);

    // Retorna o caminho relativo para salvar no DB
    return `orders/${orderId}/${filename}`;
  }

  async download(filepath: string): Promise<NodeJS.ReadableStream> {
    const fullPath = path.join(this.basePath, filepath);
    try {
      await fs.access(fullPath);
      return createReadStream(fullPath);
    } catch (error) {
      throw new Error('Arquivo não encontrado no disco');
    }
  }

  async delete(filepath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filepath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignora se arquivo já não existir
      console.warn(`Tentativa de deletar arquivo inexistente: ${fullPath}`);
    }
  }
}
