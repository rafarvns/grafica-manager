import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { Textarea } from '@/components/ui/Textarea/Textarea';

describe('Form Elements', () => {
  describe('Checkbox', () => {
    it('renderiza corretamente com label', () => {
      render(<Checkbox id="test-check" label="Aceitar termos" />);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Aceitar termos' });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('permite marcação via clique', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Checkbox id="test-check" label="Aceite" onChange={onChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      
      expect(checkbox).toBeChecked();
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('aplica o estado indeterminate', () => {
      render(<Checkbox id="test-check" indeterminate readOnly />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('não possui violações de acessibilidade', async () => {
      const { container } = render(<Checkbox id="test-check" label="Aceitar" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Textarea', () => {
    it('renderiza com label e se associa corretamente', () => {
      render(<Textarea id="test-text" label="Mensagem" />);
      const textarea = screen.getByRole('textbox', { name: 'Mensagem' });
      expect(textarea).toBeInTheDocument();
    });

    it('exibe mensagem de erro e aplica aria-describedby', () => {
      render(<Textarea id="test-text" label="Msg" error="Muito curto" />);
      const textarea = screen.getByRole('textbox');
      const errorMessage = screen.getByText('Muito curto');
      
      expect(errorMessage).toBeInTheDocument();
      expect(textarea).toHaveAttribute('aria-describedby', 'test-text-error');
      expect(errorMessage).toHaveAttribute('id', 'test-text-error');
    });

    it('encaminha ref via forwardRef', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea id="test-ref" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('não possui violações de acessibilidade', async () => {
      const { container } = render(<Textarea id="test-text" label="Observação" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
