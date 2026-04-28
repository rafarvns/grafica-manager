export interface FileStorage {
  upload(orderId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<string>;
  download(filepath: string): Promise<NodeJS.ReadableStream>;
  delete(filepath: string): Promise<void>;
}
