import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import type { PrintQualityLevel } from '../../src/types/printer';

const CACHE_DIRNAME = 'printer-presets';
const KEY_ALLOWED = /^[A-Za-z0-9 _\-().,#]+$/;

function getCacheDir(): string {
  return path.join(app.getPath('userData'), CACHE_DIRNAME);
}

function sanitizeForFilename(value: string): string {
  if (!KEY_ALLOWED.test(value)) {
    throw new Error(`Valor contém caracteres inválidos para cache key: ${value}`);
  }
  return value;
}

export function buildCacheKey(
  printerName: string,
  driverHash: string,
  quality: PrintQualityLevel
): string {
  const safePrinter = sanitizeForFilename(printerName);
  const safeHash = sanitizeForFilename(driverHash);
  return `${safePrinter}__${safeHash}__${quality}`;
}

export async function loadDevmodeBlob(key: string): Promise<Buffer | null> {
  sanitizeForFilename(key);
  const filePath = path.join(getCacheDir(), `${key}.devmode`);
  try {
    return await fs.readFile(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    console.error('[devmodeCache] load falhou:', err);
    return null;
  }
}

export async function saveDevmodeBlob(key: string, blob: Buffer): Promise<void> {
  sanitizeForFilename(key);
  const dir = getCacheDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${key}.devmode`);
  await fs.writeFile(filePath, blob);
}
