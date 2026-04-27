import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';

describe('Spinner', () => {
  it('renderiza com role="status"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('tem aria-label acessível', () => {
    render(<Spinner label="Carregando dados" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando dados');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<Spinner label="Carregando" />);
    const results = await axe(container);
    // @ts-expect-error — matcher injetado via expect.extend
    expect(results).toHaveNoViolations();
  });
});

describe('Badge', () => {
  it('renderiza o texto correto', () => {
    render(<Badge>Ativo</Badge>);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    const results = await axe(container);
    // @ts-expect-error — matcher injetado via expect.extend
    expect(results).toHaveNoViolations();
  });
});

describe('Modal', () => {
  it('não renderiza quando isOpen é false', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Teste" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza com role="dialog" e aria-modal quando aberto', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Confirmar" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('exibe o título do modal', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Meu Modal" />);
    expect(screen.getByText('Meu Modal')).toBeInTheDocument();
  });
});
