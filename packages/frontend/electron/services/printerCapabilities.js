"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrinterCapabilities = getPrinterCapabilities;
exports.clearCapabilitiesCache = clearCapabilitiesCache;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const PRINTER_NAME_ALLOWED = /^[A-Za-z0-9 _\-().,#]+$/;
const PS_TIMEOUT_MS = 15 * 1000;
const TEMP_DIR_NAME = 'grafica-manager';
function sanitizePrinterName(name) {
    if (!PRINTER_NAME_ALLOWED.test(name)) {
        throw new Error(`Nome de impressora contém caracteres não permitidos: ${name}`);
    }
    return name;
}
const PS_SCRIPT = `param([Parameter(Mandatory=$true)][string]$PrinterName)
$ErrorActionPreference = 'Stop'

$src = @"
using System;
using System.Runtime.InteropServices;

public static class PrinterCaps {
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, EntryPoint="DeviceCapabilitiesW")]
    static extern int DeviceCapabilities(string device, string port, ushort capability, IntPtr output, IntPtr devmode);

    const ushort DC_DUPLEX       = 7;
    const ushort DC_COLORDEVICE  = 32;

    public static int Duplex(string name) { return DeviceCapabilities(name, null, DC_DUPLEX, IntPtr.Zero, IntPtr.Zero); }
    public static int Color(string name)  { return DeviceCapabilities(name, null, DC_COLORDEVICE, IntPtr.Zero, IntPtr.Zero); }
}
"@

try { Add-Type -TypeDefinition $src -Language CSharp -ErrorAction Stop } catch {
    [Console]::Error.WriteLine("Add-Type falhou: $_")
    exit 3
}

try {
    $d = [PrinterCaps]::Duplex($PrinterName)
    $c = [PrinterCaps]::Color($PrinterName)
    Write-Output ("duplex=" + $d + " color=" + $c)
    exit 0
} catch {
    [Console]::Error.WriteLine("DeviceCapabilities lançou: $_")
    exit 4
}
`;
let cachedScriptPath = null;
async function ensureScriptOnDisk() {
    if (cachedScriptPath) {
        try {
            await fs_1.promises.access(cachedScriptPath);
            return cachedScriptPath;
        }
        catch {
            cachedScriptPath = null;
        }
    }
    const dir = path_1.default.join(os_1.default.tmpdir(), TEMP_DIR_NAME);
    await fs_1.promises.mkdir(dir, { recursive: true });
    const filePath = path_1.default.join(dir, `printer-caps-${(0, crypto_1.randomUUID)()}.ps1`);
    await fs_1.promises.writeFile(filePath, PS_SCRIPT, 'utf-8');
    cachedScriptPath = filePath;
    return filePath;
}
function runPs(scriptPath, args, timeoutMs) {
    return new Promise((resolve, reject) => {
        const ps = (0, child_process_1.spawn)('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-NonInteractive', '-File', scriptPath, ...args], { windowsHide: true });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            ps.kill();
            reject(new Error(`PowerShell timeout (${timeoutMs}ms)`));
        }, timeoutMs);
        ps.stdout.on('data', (c) => { stdout += c.toString(); });
        ps.stderr.on('data', (c) => { stderr += c.toString(); });
        ps.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, exitCode: code }); });
        ps.on('error', (err) => { clearTimeout(timer); reject(err); });
    });
}
const cache = new Map();
const RESULT_RE = /duplex=(-?\d+) color=(-?\d+)/;
/**
 * Consulta as capacidades da impressora via Win32 `DeviceCapabilities`
 * (DC_DUPLEX, DC_COLORDEVICE). Resultado cacheado em memória por nome.
 *
 * Em caso de erro/falha, retorna `{ supportsDuplex: true, supportsColor: true }`
 * (defaults permissivos) — assumir que suporta evita restringir UI por engano.
 */
async function getPrinterCapabilities(printerName) {
    const safeName = sanitizePrinterName(printerName);
    const cached = cache.get(safeName);
    if (cached)
        return cached;
    try {
        const scriptPath = await ensureScriptOnDisk();
        const result = await runPs(scriptPath, ['-PrinterName', safeName], PS_TIMEOUT_MS);
        if (result.stderr.trim()) {
            console.warn('[printerCapabilities] stderr:', result.stderr.trim());
        }
        const match = result.stdout.match(RESULT_RE);
        if (!match) {
            console.warn('[printerCapabilities] formato inesperado:', result.stdout);
            return { supportsDuplex: true, supportsColor: true };
        }
        const duplex = Number(match[1]);
        const color = Number(match[2]);
        const caps = {
            // DeviceCapabilities retorna 1 quando suporta, 0 quando não, -1 em erro.
            supportsDuplex: duplex === 1,
            supportsColor: color === 1,
        };
        cache.set(safeName, caps);
        console.log('[printerCapabilities]', safeName, caps);
        return caps;
    }
    catch (err) {
        console.error('[printerCapabilities] falhou:', err);
        return { supportsDuplex: true, supportsColor: true };
    }
}
function clearCapabilitiesCache() {
    cache.clear();
}
//# sourceMappingURL=printerCapabilities.js.map