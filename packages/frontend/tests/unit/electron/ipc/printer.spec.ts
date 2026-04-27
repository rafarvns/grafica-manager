import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import ptp from 'pdf-to-printer';
import { setupPrinterHandlers } from '../../../../electron/ipc/printer';
import { PrinterStatus } from '../../../../src/types/printer';

// Mock electron
vi.mock('electron', () => {
  return {
    ipcMain: {
      handle: vi.fn(),
    },
    BrowserWindow: {
      getAllWindows: vi.fn(() => [{
        webContents: {
          getPrintersAsync: vi.fn().mockResolvedValue([
            {
              name: 'Microsoft Print to PDF',
              displayName: 'Microsoft Print to PDF',
              description: 'Local Printer',
              status: 0,
              isDefault: true,
              options: {},
            },
            {
              name: 'Epson L3150',
              displayName: 'Epson L3150 Series',
              description: 'Network Printer',
              status: 8, // PAPER_JAM
              isDefault: false,
              options: {},
            }
          ])
        }
      }])
    }
  };
});

// Mock pdf-to-printer
vi.mock('pdf-to-printer', () => {
  return {
    default: {
      print: vi.fn().mockResolvedValue(undefined),
    }
  };
});

describe('Printer IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register IPC handlers', () => {
    setupPrinterHandlers();
    expect(ipcMain.handle).toHaveBeenCalledWith('printer:get-list', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('printer:print-pdf', expect.any(Function));
  });

  it('should fetch printers from webContents', async () => {
    setupPrinterHandlers();
    const getPrintersHandler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'printer:get-list')?.[1];
    
    expect(getPrintersHandler).toBeDefined();
    if (getPrintersHandler) {
      const printers = await getPrintersHandler({} as any);
      expect(printers).toHaveLength(2);
      expect(printers[0].name).toBe('Microsoft Print to PDF');
      expect(printers[1].status).toBe(PrinterStatus.PAPER_JAM);
    }
  });

  it('should call pdf-to-printer to print a file', async () => {
    setupPrinterHandlers();
    const printPdfHandler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'printer:print-pdf')?.[1];
    
    expect(printPdfHandler).toBeDefined();
    if (printPdfHandler) {
      const result = await printPdfHandler({} as any, 'C:\\test.pdf', { printer: 'Epson L3150', copies: 2 });
      expect(result).toBe(true);
      expect(ptp.print).toHaveBeenCalledWith('C:\\test.pdf', { printer: 'Epson L3150', copies: 2 });
    }
  });

  it('should return false if print throws an error', async () => {
    vi.mocked(ptp.print).mockRejectedValueOnce(new Error('Printer not found'));
    setupPrinterHandlers();
    const printPdfHandler = vi.mocked(ipcMain.handle).mock.calls.find(call => call[0] === 'printer:print-pdf')?.[1];
    
    if (printPdfHandler) {
      const result = await printPdfHandler({} as any, 'C:\\test.pdf', { printer: 'Invalid' });
      expect(result).toBe(false);
    }
  });
});
