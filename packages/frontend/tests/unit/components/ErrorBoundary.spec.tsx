import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary/ErrorBoundary';

// Suppress error logs during tests
const originalError = console.error;

function ThrowError(): never {
  throw new Error('Test error');
}

function GoodComponent(): React.ReactElement {
  return <div>Good component</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Good component')).toBeInTheDocument();
  });

  it('catches error and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
  });

  it('displays reload button in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const button = screen.getByRole('button', { name: /recarregar/i });
    expect(button).toBeInTheDocument();
  });

  it('has reload button that exists', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /recarregar/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/recarregar/i);
  });

  it('displays error message in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
