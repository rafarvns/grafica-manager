import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/Button/Button';

describe('Button', () => {
  it('renderiza o texto correto', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('chama onClick quando clicado', async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Clique</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('não chama onClick quando disabled', async () => {
    const handler = vi.fn();
    render(<Button disabled onClick={handler}>Bloqueado</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('aplica aria-disabled quando disabled', () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('encaminha ref via forwardRef', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('aplica classes ao elemento raiz', () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.firstElementChild;
    // CSS Modules geram hashes; verificamos apenas que há className definida
    expect(btn?.className.trim().length).toBeGreaterThan(0);
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<Button>Acessível</Button>);
    const results = await axe(container);
    // @ts-expect-error — matcher injetado pelo vitest-axe/extend-expect
    expect(results).toHaveNoViolations();
  });

  it('não tem violações de acessibilidade quando disabled', async () => {
    const { container } = render(<Button disabled>Desabilitado</Button>);
    const results = await axe(container);
    // @ts-expect-error — matcher injetado pelo vitest-axe/extend-expect
    expect(results).toHaveNoViolations();
  });
});
