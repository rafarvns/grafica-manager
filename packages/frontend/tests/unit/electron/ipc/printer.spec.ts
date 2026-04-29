import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrinterStatus } from '../../../../src/types/printer';

// vi.hoisted ensures these values are created BEFORE vi.mock factories run
const {
  ipcHandlers,
  ipcMainMock,
  getPrintersAsync,
  BrowserWindowMock,
  ptpPrint,
} = vi.hoisted(() => {
  const ipcHandlers: Record<string, (...args: unknown[]) => unknown> = {};
  const ipcMainMock = {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      ipcHandlers[channel] = handler;
    }),
  };
  const getPrintersAsync = vi.fn().mockResolvedValue([
    { name: 'Microsoft Print to PDF', displayName: 'Microsoft Print to PDF', status: 0, isDefault: true, options: {} },
    { name: 'Epson L3150', displayName: 'Epson L3150 Series', status: 8, isDefault: false, options: {} },
  ]);
  const BrowserWindowMock = {
    getAllWindows: vi.fn(() => [{ webContents: { getPrintersAsync } }]),
  };
  const ptpPrint = vi.fn().mockResolvedValue(undefined);
  return { ipcHandlers, ipcMainMock, getPrintersAsync, BrowserWindowMock, ptpPrint };
});

vi.mock('electron', () => ({
  ipcMain: ipcMainMock,
  BrowserWindow: BrowserWindowMock,
}));

vi.mock('pdf-to-printer', () => ({
  default: { print: ptpPrint },
}));

vi.mock('fs', () => ({
  default: { existsSync: vi.fn().mockReturnValue(true) },
  existsSync: vi.fn().mockReturnValue(true),
}));

import { setupPrinterHandlers } from '../../../../electron/ipc/printer';

describe('Printer IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete ipcHandlers['printer:get-list'];
    delete ipcHandlers['printer:print-pdf'];
    ipcMainMock.handle.mockImplementation((channel: string, handler: (...args: unknown[]) => unknown) => {
      ipcHandlers[channel] = handler;
    });
    getPrintersAsync.mockResolvedValue([
      { name: 'Microsoft Print to PDF', displayName: 'Microsoft Print to PDF', status: 0, isDefault: true, options: {} },
      { name: 'Epson L3150', displayName: 'Epson L3150 Series', status: 8, isDefault: false, options: {} },
    ]);
    ptpPrint.mockResolvedValue(undefined);
  });

  it('should register IPC handlers', () => {
    setupPrinterHandlers();
    expect(ipcMainMock.handle).toHaveBeenCalledWith('printer:get-list', expect.any(Function));
    expect(ipcMainMock.handle).toHaveBeenCalledWith('printer:print-pdf', expect.any(Function));
  });

  it('should fetch printers from webContents', async () => {
    setupPrinterHandlers();
    const handler = ipcHandlers['printer:get-list'];
    expect(handler).toBeDefined();
    if (handler) {
      const printers = await handler({}) as Array<Record<string, unknown>>;
      expect(printers).toHaveLength(2);
      expect(printers[0].name).toBe('Microsoft Print to PDF');
      expect(printers[1].status).toBe(PrinterStatus.PAPER_JAM);
    }
  });

  it('should call pdf-to-printer to print a file', async () => {
    setupPrinterHandlers();
    const handler = ipcHandlers['printer:print-pdf'];
    expect(handler).toBeDefined();
    if (handler) {
      const result = await handler({}, 'C:\\test.pdf', { printer: 'Epson L3150', copies: 2 });
      expect(result).toBe(true);
      expect(ptpPrint).toHaveBeenCalledWith('C:\\test.pdf', { printer: 'Epson L3150', copies: 2 });
    }
  });

  it('should return false if print throws an error', async () => {
    ptpPrint.mockRejectedValueOnce(new Error('Printer not found'));
    setupPrinterHandlers();
    const handler = ipcHandlers['printer:print-pdf'];
    if (handler) {
      const result = await handler({}, 'C:\\test.pdf', { printer: 'Invalid' });
      expect(result).toBe(false);
    }
  });
});
