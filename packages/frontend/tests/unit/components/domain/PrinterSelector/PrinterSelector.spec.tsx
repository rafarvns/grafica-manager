import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PrinterSelector } from '@/components/domain/PrinterSelector/PrinterSelector';
import { printerService } from '@/services/printerService';
import { PrinterStatus } from '@/types/printer';

vi.mock('@/services/printerService', () => ({
  printerService: {
    getPrinters: vi.fn()
  }
}));

describe('PrinterSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display printers in a select input', async () => {
    vi.mocked(printerService.getPrinters).mockResolvedValue([
      { name: 'Printer A', displayName: 'Printer A', description: '', status: PrinterStatus.READY, isDefault: true, options: {} },
      { name: 'Printer B', displayName: 'Printer B', description: '', status: PrinterStatus.OFFLINE, isDefault: false, options: {} },
    ]);

    render(<PrinterSelector />);

    expect(screen.getByText('Carregando impressoras...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Printer A');
    expect(options[1]).toHaveTextContent('Printer B');
  });

  it('should show an alert if the selected printer has an error status', async () => {
    vi.mocked(printerService.getPrinters).mockResolvedValue([
      { name: 'Printer A', displayName: 'Printer A', description: '', status: PrinterStatus.READY, isDefault: false, options: {} },
      { name: 'Printer B', displayName: 'Printer B', description: '', status: PrinterStatus.PAPER_JAM, isDefault: false, options: {} },
    ]);

    render(<PrinterSelector onDetailsClick={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    
    // Select Printer B
    fireEvent.change(select, { target: { value: 'Printer B' } });

    await waitFor(() => {
      expect(screen.getByText(/Atenção:/)).toBeInTheDocument();
      expect(screen.getByText(/Atolamento de papel/i)).toBeInTheDocument();
    });

    // Select Printer A
    fireEvent.change(select, { target: { value: 'Printer A' } });

    await waitFor(() => {
      expect(screen.queryByText(/Atenção:/)).not.toBeInTheDocument();
    });
  });
});
