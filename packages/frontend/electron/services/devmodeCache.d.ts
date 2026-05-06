import type { PrintQualityLevel } from '../../src/types/printer';
export declare function buildCacheKey(printerName: string, driverHash: string, quality: PrintQualityLevel): string;
export declare function loadDevmodeBlob(key: string): Promise<Buffer | null>;
export declare function saveDevmodeBlob(key: string, blob: Buffer): Promise<void>;
//# sourceMappingURL=devmodeCache.d.ts.map