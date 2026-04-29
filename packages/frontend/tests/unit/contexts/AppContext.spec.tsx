import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AppProvider, useAppContext } from '@/contexts/AppContext';

function TestConsumer() {
  useAppContext();
  return <div>App Context Active</div>;
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

  it('fornece contexto sem tema (tema claro fixo)', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
