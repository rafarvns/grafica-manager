import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '@/contexts/AppContext';

function TestConsumer() {
  const { theme, toggleTheme } = useAppContext();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe('AppContext', () => {
  it('lança erro se useAppContext for usado fora do AppProvider', () => {
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
});
