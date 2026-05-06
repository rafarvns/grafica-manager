import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const PRINTER_NAME_ALLOWED = /^[A-Za-z0-9 _\-().,#]+$/;
const PS_TIMEOUT_MS = 15 * 1000;
const TEMP_DIR_NAME = 'grafica-manager';

function sanitizePrinterName(name: string): string {
  if (!PRINTER_NAME_ALLOWED.test(name)) {
    throw new Error(`Nome de impressora contém caracteres não permitidos: ${name}`);
  }
  return name;
}

export interface PrinterCapabilities {
  supportsDuplex: boolean;
  supportsColor: boolean;
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

let cachedScriptPath: string | null = null;

async function ensureScriptOnDisk(): Promise<string> {
  if (cachedScriptPath) {
    try {
      await fs.access(cachedScriptPath);
      return cachedScriptPath;
    } catch {
      cachedScriptPath = null;
    }
  }
  const dir = path.join(os.tmpdir(), TEMP_DIR_NAME);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `printer-caps-${randomUUID()}.ps1`);
  await fs.writeFile(filePath, PS_SCRIPT, 'utf-8');
  cachedScriptPath = filePath;
  return filePath;
}

interface PsResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function runPs(scriptPath: string, args: string[], timeoutMs: number): Promise<PsResult> {
  return new Promise((resolve, reject) => {
    const ps = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-NonInteractive', '-File', scriptPath, ...args],
      { windowsHide: true }
    );
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      ps.kill();
      reject(new Error(`PowerShell timeout (${timeoutMs}ms)`));
    }, timeoutMs);
    ps.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
    ps.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
    ps.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, exitCode: code }); });
    ps.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

const cache = new Map<string, PrinterCapabilities>();

const RESULT_RE = /duplex=(-?\d+) color=(-?\d+)/;

/**
 * Consulta as capacidades da impressora via Win32 `DeviceCapabilities`
 * (DC_DUPLEX, DC_COLORDEVICE). Resultado cacheado em memória por nome.
 *
 * Em caso de erro/falha, retorna `{ supportsDuplex: true, supportsColor: true }`
 * (defaults permissivos) — assumir que suporta evita restringir UI por engano.
 */
export async function getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities> {
  const safeName = sanitizePrinterName(printerName);
  const cached = cache.get(safeName);
  if (cached) return cached;

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
    const caps: PrinterCapabilities = {
      // DeviceCapabilities retorna 1 quando suporta, 0 quando não, -1 em erro.
      supportsDuplex: duplex === 1,
      supportsColor: color === 1,
    };
    cache.set(safeName, caps);
    console.log('[printerCapabilities]', safeName, caps);
    return caps;
  } catch (err) {
    console.error('[printerCapabilities] falhou:', err);
    return { supportsDuplex: true, supportsColor: true };
  }
}

export function clearCapabilitiesCache(): void {
  cache.clear();
}
