import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Input } from '@/components/ui/Input/Input';

describe('Input', () => {
  it('associa label ao input via htmlFor + id', () => {
    render(<Input id="nome" label="Nome do cliente" />);
    const input = screen.getByLabelText('Nome do cliente');
    expect(input).toBeInTheDocument();
  });

  it('aplica aria-describedby apontando para o elemento de erro', () => {
    render(<Input id="email" label="Email" error="Campo obrigatório" />);
    const input = screen.getByLabelText('Email');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    const errorEl = document.getElementById(errorId!);
    expect(errorEl?.textContent).toBe('Campo obrigatório');
  });

  it('não aplica aria-describedby quando não há erro', () => {
    render(<Input id="campo" label="Campo" />);
    expect(screen.getByLabelText('Campo')).not.toHaveAttribute('aria-describedby');
  });

  it('encaminha ref via forwardRef', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input id="ref-test" label="Ref" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(<Input id="a11y" label="Teste" />);
    const results = await axe(container);
    // @ts-expect-error — matcher injetado via expect.extend
    expect(results).toHaveNoViolations();
  });

  it('não tem violações de acessibilidade com erro', async () => {
    const { container } = render(
      <Input id="a11y-err" label="Teste" error="Inválido" />,
    );
    const results = await axe(container);
    // @ts-expect-error — matcher injetado via expect.extend
    expect(results).toHaveNoViolations();
  });
});
