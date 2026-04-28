import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class FileStorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = process.env.FILE_STORAGE_PATH || './uploads';
  }

  async saveLogo(file: Buffer, originalName: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      throw new Error('Formato de arquivo inválido. Use PNG ou JPG.');
    }

    const fileName = `logo_${Date.now()}${ext}`;
    const targetDir = path.join(this.storagePath, 'system');
    const targetPath = path.join(targetDir, fileName);

    await fs.mkdir(targetDir, { recursive: true });
    
    // Delete old logos
    const files = await fs.readdir(targetDir);
    for (const f of files) {
      if (f.startsWith('logo_')) {
        await fs.unlink(path.join(targetDir, f)).catch(() => {});
      }
    }

    await fs.writeFile(targetPath, file);

    return `/uploads/system/${fileName}`;
  }

  async deleteLogo(logoPath: string): Promise<void> {
    const fileName = path.basename(logoPath);
    const fullPath = path.join(this.storagePath, 'system', fileName);
    await fs.unlink(fullPath).catch(() => {});
  }
}
