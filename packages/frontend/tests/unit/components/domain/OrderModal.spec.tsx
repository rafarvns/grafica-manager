import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderModal } from '@/components/domain/OrderModal';
import { NotificationProvider } from '@/contexts/NotificationContext';

describe('OrderModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const renderModal = (props = {}) => {
    return render(
      <NotificationProvider>
        <OrderModal {...defaultProps} {...props} />
      </NotificationProvider>
    );
  };

  it('não renderiza se isOpen for false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('exibe erros de validação ao tentar salvar vazio', async () => {
    renderModal();
    
    const saveButton = screen.getByText(/Salvar|Criar/i);
    fireEvent.click(saveButton);

    const error = await screen.findByText(/Cliente é obrigatório/i);
    expect(error).toBeDefined();
  });

  it('fecha o modal ao clicar no botão cancelar', () => {
    renderModal();
    
    const cancelButton = screen.getByText(/Cancelar/i);
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
