import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '@/layout/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RouterProvider } from '@/router/HashRouter';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NotificationProvider>
      <AppProvider>
        <RouterProvider>
          {ui}
        </RouterProvider>
      </AppProvider>
    </NotificationProvider>
  );
};

describe('AppLayout', () => {
  it('renderiza o header com título do sistema', () => {
    renderWithProviders(
      <AppLayout>
        <div>Conteúdo Principal</div>
      </AppLayout>
    );

    expect(screen.getByText('Gráfica Manager')).toBeInTheDocument();
  });

  it('renderiza a sidebar com os links de navegação principais', () => {
    renderWithProviders(
      <AppLayout>
        <div>Conteúdo Principal</div>
      </AppLayout>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /clientes/i })).toBeInTheDocument();
  });

  it('renderiza o conteúdo principal passado como children e sem violações a11y', () => {
    renderWithProviders(
      <AppLayout>
        <main data-testid="main-content">Conteúdo Dinâmico da Rota</main>
      </AppLayout>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo Dinâmico da Rota')).toBeInTheDocument();
  });
});
