import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '@/contexts/AppContext';

// Componente helper para consumir o hook nos testes de render
function TestConsumer() {
  const { theme, toggleTheme, addToast } = useAppContext();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => addToast({ message: 'Aviso', type: 'info' })}>
        Add Toast
      </button>
    </div>
  );
}

describe('AppContext', () => {
  it('lança erro se useAppContext for usado fora do AppProvider', () => {
    // Silencia o console.error temporariamente pois o React joga o erro renderizando
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => render(<TestConsumer />)).toThrow(
      'useAppContext deve ser usado dentro de um AppProvider',
    );

    console.error = originalError;
  });

  it('provê o tema padrão como light', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('permite alternar o tema e aplica o atributo no html', async () => {
    // mock do localStorage para testes de tema não afetarem globalmente
    vi.spyOn(Storage.prototype, 'setItem');
    
    const { getByText, getByTestId } = render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      getByText('Toggle Theme').click();
    });

    expect(getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('grafica-theme', 'dark');

    act(() => {
      getByText('Toggle Theme').click();
    });

    expect(getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('integração com Toasts exibe o toast renderizado', () => {
    const { getByText } = render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    act(() => {
      getByText('Add Toast').click();
    });

    // O ToastContainer deve ser renderizado pelo AppProvider e conter a mensagem
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Aviso')).toBeInTheDocument();
  });
});
