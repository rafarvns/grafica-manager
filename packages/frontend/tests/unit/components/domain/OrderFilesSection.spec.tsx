import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderFilesSection } from '@/components/domain/OrderFilesSection';

describe('OrderFilesSection', () => {
  const mockOrder = {
    id: '1',
    attachments: [
      { id: 'f1', originalFilename: 'arte.pdf', size: 1024, storageUrl: '/uploads/arte.pdf' },
    ],
  };

  it('deve listar arquivos anexados', () => {
    render(
      <OrderFilesSection
        order={mockOrder as any}
        onUpload={vi.fn()}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText('arte.pdf')).toBeDefined();
    expect(screen.getByText('1 KB')).toBeDefined();
  });

  it('deve chamar onUpload ao selecionar arquivo', async () => {
    const onUpload = vi.fn();
    render(
      <OrderFilesSection
        order={mockOrder as any}
        onUpload={onUpload}
        onDownload={vi.fn()}
      />
    );

    const input = screen.getByTestId('file-upload-input');
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalled();
  });
});
