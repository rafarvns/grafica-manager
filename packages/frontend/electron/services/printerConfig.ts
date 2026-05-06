import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { app } from 'electron';
import type { PrintQualityLevel } from '../../src/types/printer';
import {
  buildCacheKey,
  loadDevmodeBlob,
  saveDevmodeBlob,
} from './devmodeCache';

const PRINTER_NAME_ALLOWED = /^[A-Za-z0-9 _\-().,#]+$/;
const PS_DIALOG_TIMEOUT_MS = 5 * 60 * 1000;
const TEMP_DIR_NAME = 'grafica-manager';

function sanitizePrinterName(name: string): string {
  if (!PRINTER_NAME_ALLOWED.test(name)) {
    throw new Error(`Nome de impressora contém caracteres não permitidos: ${name}`);
  }
  return name;
}

interface PsResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function runPowerShellFile(scriptPath: string, scriptArgs: string[], timeoutMs: number): Promise<PsResult> {
  return new Promise((resolve, reject) => {
    const ps = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Sta', '-File', scriptPath, ...scriptArgs],
      { windowsHide: false }
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      ps.kill();
      reject(new Error(`PowerShell timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    ps.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    ps.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    ps.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code });
    });
    ps.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

const PS_SCRIPT = `param(
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [int]$Orientation        = 0,
    [int]$Copies             = 0,
    [int]$Color              = 0,
    [int]$Duplex             = 0,
    [string]$CachedDevmodePath = '',
    [string]$OutputDevmodePath = ''
)

$ErrorActionPreference = 'Stop'

$src = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct DEVMODE {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
    public ushort dmSpecVersion;
    public ushort dmDriverVersion;
    public ushort dmSize;
    public ushort dmDriverExtra;
    public uint   dmFields;
    public short  dmOrientation;
    public short  dmPaperSize;
    public short  dmPaperLength;
    public short  dmPaperWidth;
    public short  dmScale;
    public short  dmCopies;
    public short  dmDefaultSource;
    public short  dmPrintQuality;
    public short  dmColor;
    public short  dmDuplex;
    public short  dmYResolution;
    public short  dmTTOption;
    public short  dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
    public ushort dmLogPixels;
    public uint   dmBitsPerPel;
    public uint   dmPelsWidth;
    public uint   dmPelsHeight;
    public uint   dmDisplayFlags;
    public uint   dmDisplayFrequency;
    public uint   dmICMMethod;
    public uint   dmICMIntent;
    public uint   dmMediaType;
    public uint   dmDitherType;
    public uint   dmReserved1;
    public uint   dmReserved2;
    public uint   dmPanningWidth;
    public uint   dmPanningHeight;
}

public static class PrinterDialog {
    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Unicode, EntryPoint="OpenPrinterW")]
    static extern bool OpenPrinter(string n, out IntPtr h, ref PRINTER_DEFAULTS d);

    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Unicode, EntryPoint="DocumentPropertiesW")]
    static extern int DocumentProperties(IntPtr hWnd, IntPtr h, string n, IntPtr o, IntPtr i, int m);

    [DllImport("winspool.drv", SetLastError=true)]
    static extern bool ClosePrinter(IntPtr h);

    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Unicode, EntryPoint="SetPrinterW")]
    static extern bool SetPrinter(IntPtr h, int level, IntPtr p, int cmd);

    [StructLayout(LayoutKind.Sequential)]
    public struct PRINTER_DEFAULTS {
        public IntPtr pDatatype;
        public IntPtr pDevMode;
        public int DesiredAccess;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PRINTER_INFO_9 {
        public IntPtr pDevMode;
    }

    const int  PRINTER_ACCESS_ADMINISTER = 0x4;
    const int  PRINTER_ACCESS_USE        = 0x8;
    const int  DM_IN_PROMPT              = 4;
    const int  DM_OUT_BUFFER             = 2;
    const int  DM_IN_BUFFER              = 8;
    const int  IDOK                      = 1;
    const uint DM_ORIENTATION            = 0x1;
    const uint DM_COPIES                 = 0x100;
    const uint DM_COLOR                  = 0x800;
    const uint DM_DUPLEX                 = 0x1000;

    static void DumpDevmode(string label, DEVMODE d) {
        Console.Error.WriteLine(
            "[devmode " + label + "] " +
            "fields=0x" + d.dmFields.ToString("X") + " " +
            "orient=" + d.dmOrientation + " " +
            "copies=" + d.dmCopies + " " +
            "quality=" + d.dmPrintQuality + " " +
            "yres=" + d.dmYResolution + " " +
            "color=" + d.dmColor + " " +
            "duplex=" + d.dmDuplex
        );
    }

    static bool PersistDevmode(IntPtr h, IntPtr dmPtr) {
        var info9 = new PRINTER_INFO_9 { pDevMode = dmPtr };
        IntPtr p = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(PRINTER_INFO_9)));
        try {
            Marshal.StructureToPtr(info9, p, false);
            return SetPrinter(h, 9, p, 0);
        } finally { Marshal.FreeHGlobal(p); }
    }

    public static int Show(
        string name,
        int orientation,
        int copies,
        int color,
        int duplex,
        string cachedDevmodePath,
        string outputDevmodePath
    ) {
        var pdAdmin = new PRINTER_DEFAULTS { DesiredAccess = PRINTER_ACCESS_ADMINISTER | PRINTER_ACCESS_USE };
        var pdUse   = new PRINTER_DEFAULTS { DesiredAccess = PRINTER_ACCESS_USE };
        IntPtr h;
        bool canPersist = OpenPrinter(name, out h, ref pdAdmin);
        if (!canPersist && !OpenPrinter(name, out h, ref pdUse)) {
            return 2;
        }
        try {
            int size = DocumentProperties(IntPtr.Zero, h, name, IntPtr.Zero, IntPtr.Zero, 0);
            if (size <= 0) return 2;
            IntPtr dm = Marshal.AllocHGlobal(size);
            byte[] snapshotBytes = null;
            try {
                // 1. Lê DEVMODE atual (snapshot para rollback e fonte de verdade da versão do driver).
                int rGet = DocumentProperties(IntPtr.Zero, h, name, dm, IntPtr.Zero, DM_OUT_BUFFER);
                if (rGet != IDOK) return 2;
                snapshotBytes = new byte[size];
                Marshal.Copy(dm, snapshotBytes, 0, size);
                DEVMODE devmode = (DEVMODE)Marshal.PtrToStructure(dm, typeof(DEVMODE));
                DumpDevmode("GET", devmode);
                Console.Error.WriteLine(
                    "[devmode VERSION] spec=" + devmode.dmSpecVersion +
                    " driver=" + devmode.dmDriverVersion +
                    " size=" + devmode.dmSize +
                    " extra=" + devmode.dmDriverExtra
                );

                // 2. Pré-stage do default da impressora com o blob cached, se houver.
                bool prestaged = false;
                if (canPersist && !string.IsNullOrEmpty(cachedDevmodePath) && File.Exists(cachedDevmodePath)) {
                    byte[] cached = File.ReadAllBytes(cachedDevmodePath);
                    if (cached.Length == size) {
                        IntPtr cachedPtr = Marshal.AllocHGlobal(size);
                        try {
                            Marshal.Copy(cached, 0, cachedPtr, size);
                            DEVMODE cachedDm = (DEVMODE)Marshal.PtrToStructure(cachedPtr, typeof(DEVMODE));
                            bool versionMatch =
                                cachedDm.dmSpecVersion   == devmode.dmSpecVersion &&
                                cachedDm.dmDriverVersion == devmode.dmDriverVersion &&
                                cachedDm.dmSize          == devmode.dmSize &&
                                cachedDm.dmDriverExtra   == devmode.dmDriverExtra;
                            if (versionMatch) {
                                if (PersistDevmode(h, cachedPtr)) {
                                    prestaged = true;
                                    Console.Error.WriteLine("[devmode PRESTAGE] cached aplicado via SetPrinter level 9");
                                } else {
                                    Console.Error.WriteLine("[devmode PRESTAGE] SetPrinter falhou (lasterror=" + Marshal.GetLastWin32Error() + ")");
                                }
                            } else {
                                Console.Error.WriteLine("[devmode PRESTAGE] cached incompatível (driver version mismatch)");
                            }
                        } finally { Marshal.FreeHGlobal(cachedPtr); }
                    } else {
                        Console.Error.WriteLine("[devmode PRESTAGE] cached tamanho diferente (cache=" + cached.Length + " atual=" + size + ")");
                    }
                }

                // 3. Re-lê DEVMODE se pré-staged (dm reflete o novo default agora).
                if (prestaged) {
                    rGet = DocumentProperties(IntPtr.Zero, h, name, dm, IntPtr.Zero, DM_OUT_BUFFER);
                    if (rGet == IDOK) {
                        devmode = (DEVMODE)Marshal.PtrToStructure(dm, typeof(DEVMODE));
                        DumpDevmode("AFTER-PRESTAGE", devmode);
                    }
                }

                // 4. Aplica overrides públicos seguros (orientation/copies/color/duplex). Quality NÃO entra
                //    via campos públicos — é tratada exclusivamente pelo blob cached pré-staged acima.
                bool hasPrefill = false;
                if (orientation > 0) { devmode.dmOrientation = (short)orientation; devmode.dmFields |= DM_ORIENTATION; hasPrefill = true; }
                if (copies > 0)      { devmode.dmCopies      = (short)copies;      devmode.dmFields |= DM_COPIES;      hasPrefill = true; }
                if (color > 0)       { devmode.dmColor       = (short)color;       devmode.dmFields |= DM_COLOR;       hasPrefill = true; }
                if (duplex > 0)      { devmode.dmDuplex      = (short)duplex;      devmode.dmFields |= DM_DUPLEX;      hasPrefill = true; }

                int dialogMode = DM_IN_PROMPT | DM_OUT_BUFFER;
                IntPtr inPtr = IntPtr.Zero;
                if (hasPrefill) {
                    Marshal.StructureToPtr(devmode, dm, false);
                    DumpDevmode("APPLY (overrides públicos)", devmode);
                    dialogMode |= DM_IN_BUFFER;
                    inPtr = dm;
                }

                // 5. Mostra o diálogo. O quality vem do default já pre-staged; orientation/copies/color/duplex
                //    vêm via DM_IN_BUFFER quando aplicável.
                int rDlg = DocumentProperties(IntPtr.Zero, h, name, dm, inPtr, dialogMode);
                DEVMODE devmodeAfterDlg = (DEVMODE)Marshal.PtrToStructure(dm, typeof(DEVMODE));
                DumpDevmode("DIALOG rc=" + rDlg, devmodeAfterDlg);

                if (rDlg != IDOK) {
                    // Cancel: rollback se pré-stagemos.
                    if (prestaged && canPersist) {
                        IntPtr snapPtr = Marshal.AllocHGlobal(size);
                        try {
                            Marshal.Copy(snapshotBytes, 0, snapPtr, size);
                            if (PersistDevmode(h, snapPtr)) {
                                Console.Error.WriteLine("[devmode ROLLBACK] snapshot restaurado");
                            } else {
                                Console.Error.WriteLine("[devmode ROLLBACK] SetPrinter falhou (lasterror=" + Marshal.GetLastWin32Error() + ")");
                            }
                        } finally { Marshal.FreeHGlobal(snapPtr); }
                    }
                    return 1;
                }

                // 6a. OK: captura DEVMODE pós-dialog para o cache.
                if (!string.IsNullOrEmpty(outputDevmodePath)) {
                    byte[] finalBytes = new byte[size];
                    Marshal.Copy(dm, finalBytes, 0, size);
                    File.WriteAllBytes(outputDevmodePath, finalBytes);
                    Console.Error.WriteLine("[devmode CAPTURE] " + size + " bytes salvos em " + outputDevmodePath);
                }

                // 6b. OK: persiste DEVMODE final como default da impressora.
                if (canPersist) {
                    if (!PersistDevmode(h, dm)) {
                        Console.Error.WriteLine("[devmode PERSIST] SetPrinter falhou (lasterror=" + Marshal.GetLastWin32Error() + ")");
                    }
                }
                return 0;
            } finally { Marshal.FreeHGlobal(dm); }
        } finally { ClosePrinter(h); }
    }
}
"@

try {
    Add-Type -TypeDefinition $src -Language CSharp -ErrorAction Stop
} catch {
    [Console]::Error.WriteLine("Add-Type falhou: $_")
    exit 3
}

try {
    $code = [PrinterDialog]::Show($PrinterName, $Orientation, $Copies, $Color, $Duplex, $CachedDevmodePath, $OutputDevmodePath)
    exit $code
} catch {
    [Console]::Error.WriteLine("PrinterDialog::Show lançou: $_")
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
  const filePath = path.join(dir, `printer-dialog-${randomUUID()}.ps1`);
  await fs.writeFile(filePath, PS_SCRIPT, 'utf-8');
  cachedScriptPath = filePath;
  return filePath;
}

export interface PrintPreferencesPrefill {
  orientation?: 'portrait' | 'landscape';
  copies?: number;
  quality?: PrintQualityLevel;
  monochrome?: boolean;
  side?: 'simplex' | 'duplex' | 'duplexlong' | 'duplexshort';
}

const DUPLEX_TO_DEVMODE: Record<string, number> = {
  simplex: 1,
  duplex: 2,
  duplexlong: 2,
  duplexshort: 3,
};

function buildScriptArgs(
  printerName: string,
  prefill: PrintPreferencesPrefill | undefined,
  cachedDevmodePath: string,
  outputDevmodePath: string
): string[] {
  const orientation =
    prefill?.orientation === 'landscape' ? 2
    : prefill?.orientation === 'portrait' ? 1
    : 0;
  const copies = prefill?.copies && prefill.copies > 0 ? prefill.copies : 0;
  const color =
    prefill?.monochrome === true ? 1
    : prefill?.monochrome === false ? 2
    : 0;
  const duplex = prefill?.side ? (DUPLEX_TO_DEVMODE[prefill.side] ?? 0) : 0;

  return [
    '-PrinterName', printerName,
    '-Orientation', String(orientation),
    '-Copies', String(copies),
    '-Color', String(color),
    '-Duplex', String(duplex),
    '-CachedDevmodePath', cachedDevmodePath,
    '-OutputDevmodePath', outputDevmodePath,
  ];
}

const VERSION_LINE_RE = /\[devmode VERSION\] spec=(\d+) driver=(\d+) size=(\d+) extra=(\d+)/;

function parseDriverHash(stderr: string): string | null {
  const match = stderr.match(VERSION_LINE_RE);
  if (!match) return null;
  return `s${match[1]}d${match[2]}z${match[3]}x${match[4]}`;
}

async function safeUnlink(p: string): Promise<void> {
  try {
    await fs.unlink(p);
  } catch {
    // ignored
  }
}

async function writeCacheBlobToTemp(blob: Buffer | null): Promise<string> {
  const dir = path.join(os.tmpdir(), TEMP_DIR_NAME);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `devmode-input-${randomUUID()}.bin`);
  if (blob) await fs.writeFile(filePath, blob);
  return filePath;
}

function makeOutputBlobPath(): string {
  return path.join(os.tmpdir(), TEMP_DIR_NAME, `devmode-output-${randomUUID()}.bin`);
}

/**
 * Abre o diálogo nativo de Preferências de Impressão (Win32 DocumentProperties).
 *
 * Estratégia capture-replay (vide ADR 0006):
 * - Quality é tratada via blob DEVMODE cached por (impressora, versão do driver, qualidade).
 * - Se há blob cached compatível, ele é aplicado via SetPrinter level 9 antes do diálogo —
 *   o driver lê seu próprio DEVMODE como default e exibe a qualidade correta.
 * - Demais campos (orientation/copies/color/duplex) usam DEVMODE público + DM_IN_BUFFER, que
 *   o L3250 respeita no diálogo.
 * - No OK, o DEVMODE final é capturado e salvo no cache para a próxima vez.
 * - No Cancel, rollback do default da impressora para o snapshot pre-stage.
 *
 * Retorna true se OK, false se Cancel ou erro.
 */
export async function showPrinterPreferences(
  printerName: string,
  prefill?: PrintPreferencesPrefill
): Promise<boolean> {
  const safeName = sanitizePrinterName(printerName);
  console.log('[printerConfig] showPrinterPreferences:', { printer: safeName, prefill });

  let inputBlobPath = '';
  const outputBlobPath = makeOutputBlobPath();

  try {
    // Tenta carregar blob cached para a qualidade pedida (se houver).
    if (prefill?.quality) {
      try {
        const driverHashGuessKeys = await listCacheCandidates(safeName, prefill.quality);
        for (const key of driverHashGuessKeys) {
          const blob = await loadDevmodeBlob(key);
          if (blob) {
            inputBlobPath = await writeCacheBlobToTemp(blob);
            console.log('[printerConfig] cache HIT:', key);
            break;
          }
        }
      } catch (err) {
        console.warn('[printerConfig] erro ao carregar cache:', err);
      }
    }

    const scriptPath = await ensureScriptOnDisk();
    const args = buildScriptArgs(safeName, prefill, inputBlobPath, outputBlobPath);
    console.log('[printerConfig] script:', scriptPath);
    console.log('[printerConfig] args:', args.join(' '));

    const result = await runPowerShellFile(scriptPath, args, PS_DIALOG_TIMEOUT_MS);
    if (result.stdout.trim()) console.log('[printerConfig] PS stdout:', result.stdout.trim());
    if (result.stderr.trim()) console.error('[printerConfig] PS stderr:', result.stderr.trim());
    console.log('[printerConfig] PS exitCode:', result.exitCode, '→', result.exitCode === 0 ? 'OK' : 'CANCEL/ERROR');

    if (result.exitCode === 0 && prefill?.quality) {
      // Captura o DEVMODE pós-dialog e salva no cache para a próxima vez.
      const driverHash = parseDriverHash(result.stderr);
      if (driverHash) {
        try {
          const finalBlob = await fs.readFile(outputBlobPath);
          const cacheKey = buildCacheKey(safeName, driverHash, prefill.quality);
          await saveDevmodeBlob(cacheKey, finalBlob);
          console.log('[printerConfig] cache SAVED:', cacheKey, `(${finalBlob.length} bytes)`);
        } catch (err) {
          console.warn('[printerConfig] erro ao salvar cache:', err);
        }
      } else {
        console.warn('[printerConfig] driver hash não detectado em stderr — cache não salvo');
      }
    }

    return result.exitCode === 0;
  } catch (err) {
    console.error('[printerConfig] showPrinterPreferences falhou:', err);
    return false;
  } finally {
    if (inputBlobPath) await safeUnlink(inputBlobPath);
    await safeUnlink(outputBlobPath);
  }
}

/**
 * Lista possíveis cache keys para uma (impressora, qualidade) sem conhecer ainda o driverHash.
 * Lê o diretório de cache e filtra por prefixo. A primeira chave compatível é tentada — se o
 * blob não validar dentro do C# (driver version mismatch), prosseguimos sem prestage.
 */
async function listCacheCandidates(
  printerName: string,
  quality: PrintQualityLevel
): Promise<string[]> {
  try {
    const dir = path.join(app.getPath('userData'), 'printer-presets');
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    const prefix = `${printerName}__`;
    const suffix = `__${quality}.devmode`;
    // Ordena por mtime desc para tentar o blob mais recente primeiro.
    const matches = entries.filter((f) => f.startsWith(prefix) && f.endsWith(suffix));
    const stats = await Promise.all(
      matches.map(async (f) => ({ f, mtime: (await fs.stat(path.join(dir, f))).mtimeMs }))
    );
    stats.sort((a, b) => b.mtime - a.mtime);
    return stats.map(({ f }) => f.slice(0, -'.devmode'.length));
  } catch {
    return [];
  }
}
