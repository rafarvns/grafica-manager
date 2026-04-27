import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Toast, ToastContainer } from '@/components/ui/Toast/Toast';

describe('Toast', () => {
  it('renderiza a mensagem correta', () => {
    render(<Toast id="t1" message="Pedido salvo!" type="success" onClose={() => {}} />);
    expect(screen.getByText('Pedido salvo!')).toBeInTheDocument();
  });

  it('renderiza com role="alert"', () => {
    render(<Toast id="t1" message="Erro!" type="error" onClose={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(
      <Toast id="t1" message="Sucesso" type="success" onClose={() => {}} />,
    );
    const results = await axe(container);
    // @ts-expect-error — matcher injetado via expect.extend
    expect(results).toHaveNoViolations();
  });
});

describe('ToastContainer', () => {
  it('renderiza lista de toasts', () => {
    const toasts = [
      { id: '1', message: 'Primeiro', type: 'success' as const },
      { id: '2', message: 'Segundo', type: 'error' as const },
    ];
    render(<ToastContainer toasts={toasts} onClose={() => {}} />);
    expect(screen.getByText('Primeiro')).toBeInTheDocument();
    expect(screen.getByText('Segundo')).toBeInTheDocument();
  });

  it('não renderiza nada quando a lista está vazia', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
