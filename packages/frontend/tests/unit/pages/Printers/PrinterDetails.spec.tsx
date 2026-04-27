import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrinterDetails } from '@/pages/Printers/PrinterDetails';
import { PrinterStatus } from '@/types/printer';

describe('PrinterDetails', () => {
  const mockPrinter = {
    name: 'Epson L3150',
    displayName: 'Epson L3150 Series',
    description: 'Local printer',
    status: PrinterStatus.PAPER_JAM | PrinterStatus.OFFLINE,
    isDefault: true,
    options: {
      color: 'true',
      duplex: 'false'
    }
  };

  it('should display basic printer information', () => {
    render(<PrinterDetails printer={mockPrinter} />);
    
    expect(screen.getByText('Epson L3150')).toBeInTheDocument();
    expect(screen.getByText('Epson L3150 Series')).toBeInTheDocument();
    expect(screen.getByText('Local printer')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument(); // Padrão
  });

  it('should parse and display complex status masks', () => {
    render(<PrinterDetails printer={mockPrinter} />);
    
    // Status 8 (PAPER_JAM) | 128 (OFFLINE)
    expect(screen.getByText(/Atolamento de Papel/i)).toBeInTheDocument();
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
  });

  it('should display "Pronto" if status is 0', () => {
    render(<PrinterDetails printer={{ ...mockPrinter, status: 0 }} />);
    expect(screen.getByText(/Pronto/i)).toBeInTheDocument();
  });

  it('should display json block for options', () => {
    render(<PrinterDetails printer={mockPrinter} />);
    const jsonBlock = screen.getByText(/"color": "true"/i);
    expect(jsonBlock).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<PrinterDetails printer={mockPrinter} onClose={handleClose} />);
    
    const closeBtn = screen.getByRole('button', { name: /fechar/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
