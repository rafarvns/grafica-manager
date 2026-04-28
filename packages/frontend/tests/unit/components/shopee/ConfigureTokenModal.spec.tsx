import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigureTokenModal } from '@/components/domain/shopee/ConfigureTokenModal';

describe('ConfigureTokenModal', () => {
  it('deve renderizar o modal corretamente', () => {
    render(<ConfigureTokenModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    
    expect(screen.getByText('Configurar Token Shopee')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/insira o novo token/i)).toBeInTheDocument();
  });

  it('deve chamar onSave com o token inserido', () => {
    const onSave = vi.fn();
    render(<ConfigureTokenModal isOpen={true} onClose={() => {}} onSave={onSave} />);

    const input = screen.getByPlaceholderText(/insira o novo token/i);
    fireEvent.change(input, { target: { value: 'shopee-token-123' } });
    
    const saveButton = screen.getByText('Salvar Token');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith('shopee-token-123');
  });

  it('deve chamar onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(<ConfigureTokenModal isOpen={true} onClose={onClose} onSave={() => {}} />);

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
