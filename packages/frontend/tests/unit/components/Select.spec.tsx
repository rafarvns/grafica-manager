import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Select } from '@/components/ui/Select/Select';

describe('Select Component', () => {
  const options = [
    { value: '1', label: 'Opção 1' },
    { value: '2', label: 'Opção 2' },
  ];

  it('renderiza o select com as opções providenciadas', () => {
    render(<Select id="test-select" label="Escolha" options={options} />);
    const select = screen.getByRole('combobox', { name: 'Escolha' });
    
    expect(select).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBe(2);
  });

  it('permite selecionar um valor e chama onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<Select id="test-select" label="Escolha" options={options} onChange={onChange} />);
    const select = screen.getByRole('combobox');
    
    await user.selectOptions(select, '2');
    
    expect((select as HTMLSelectElement).value).toBe('2');
    expect(onChange).toHaveBeenCalled();
  });

  it('exibe mensagem de erro e ajusta atributos ARIA', () => {
    render(<Select id="test-select" options={options} error="Seleção inválida" />);
    const select = screen.getByRole('combobox');
    const errorMessage = screen.getByText('Seleção inválida');
    
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'test-select-error');
    expect(errorMessage).toHaveAttribute('id', 'test-select-error');
  });

  it('não possui violações de acessibilidade', async () => {
    const { container } = render(<Select id="test-select" label="Teste" options={options} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
