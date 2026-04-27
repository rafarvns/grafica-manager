import { describe, it, expect, vi, beforeEach } from 'vitest';
import { printerService } from '@/services/printerService';
import { PrinterStatus } from '@/types/printer';

describe('printerService', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      electronAPI: {
        getPrinters: vi.fn().mockResolvedValue([
          { name: 'Printer 1', status: PrinterStatus.READY },
          { name: 'Printer 2', status: PrinterStatus.PAPER_JAM },
        ]),
        printPdf: vi.fn().mockResolvedValue(true),
      }
    });
  });

  it('should get a list of printers', async () => {
    const printers = await printerService.getPrinters();
    expect(printers).toHaveLength(2);
    expect(printers[0]!.name).toBe('Printer 1');
    expect(printers[1]!.status).toBe(PrinterStatus.PAPER_JAM);
    expect(window.electronAPI!.getPrinters).toHaveBeenCalled();
  });

  it('should request printing a pdf', async () => {
    const success = await printerService.printPdf('C:\\doc.pdf', { copies: 1, printer: 'Printer 1' });
    expect(success).toBe(true);
    expect(window.electronAPI!.printPdf).toHaveBeenCalledWith('C:\\doc.pdf', { copies: 1, printer: 'Printer 1' });
  });

  it('should handle missing electronAPI gracefully', async () => {
    vi.stubGlobal('window', {});
    const printers = await printerService.getPrinters();
    expect(printers).toEqual([]);
    
    const success = await printerService.printPdf('x', {});
    expect(success).toBe(false);
  });
});
