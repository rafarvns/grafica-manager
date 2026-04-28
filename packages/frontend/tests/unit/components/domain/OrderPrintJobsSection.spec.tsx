import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderPrintJobsSection } from '@/components/domain/OrderPrintJobsSection';

describe('OrderPrintJobsSection', () => {
  const mockOrder = {
    id: '1',
    printJobs: [
      { id: 'p1', printerName: 'Epson L3250', status: 'completed', createdAt: '2026-04-28T10:00:00Z' },
    ],
  };

  it('deve listar trabalhos de impressão', () => {
    render(
      <OrderPrintJobsSection 
        order={mockOrder as any} 
        onCreatePrintJob={vi.fn()} 
      />
    );

    expect(screen.getByText('Epson L3250')).toBeDefined();
    expect(screen.getByText(/Concluído/i)).toBeDefined();
  });
});
