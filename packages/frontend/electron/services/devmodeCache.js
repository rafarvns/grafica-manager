"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCacheKey = buildCacheKey;
exports.loadDevmodeBlob = loadDevmodeBlob;
exports.saveDevmodeBlob = saveDevmodeBlob;
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const CACHE_DIRNAME = 'printer-presets';
const KEY_ALLOWED = /^[A-Za-z0-9 _\-().,#]+$/;
function getCacheDir() {
    return path_1.default.join(electron_1.app.getPath('userData'), CACHE_DIRNAME);
}
function sanitizeForFilename(value) {
    if (!KEY_ALLOWED.test(value)) {
        throw new Error(`Valor contém caracteres inválidos para cache key: ${value}`);
    }
    return value;
}
function buildCacheKey(printerName, driverHash, quality) {
    const safePrinter = sanitizeForFilename(printerName);
    const safeHash = sanitizeForFilename(driverHash);
    return `${safePrinter}__${safeHash}__${quality}`;
}
async function loadDevmodeBlob(key) {
    sanitizeForFilename(key);
    const filePath = path_1.default.join(getCacheDir(), `${key}.devmode`);
    try {
        return await fs_1.promises.readFile(filePath);
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return null;
        console.error('[devmodeCache] load falhou:', err);
        return null;
    }
}
async function saveDevmodeBlob(key, blob) {
    sanitizeForFilename(key);
    const dir = getCacheDir();
    await fs_1.promises.mkdir(dir, { recursive: true });
    const filePath = path_1.default.join(dir, `${key}.devmode`);
    await fs_1.promises.writeFile(filePath, blob);
}
//# sourceMappingURL=devmodeCache.js.map