import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '@/layout/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { RouterProvider } from '@/router/HashRouter';

// Para testar adequadamente o layout com seus provedores dependentes
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      <RouterProvider>
        {ui}
      </RouterProvider>
    </AppProvider>
  );
};

describe('AppLayout', () => {
  it('renderiza o header com título do sistema e toggle de tema', () => {
    renderWithProviders(
      <AppLayout>
        <div>Conteúdo Principal</div>
      </AppLayout>
    );

    // Header Title
    expect(screen.getByText('Gráfica Manager')).toBeInTheDocument();
    
    // Toggle Button (baseado no aria-label para acessibilidade)
    const toggleBtn = screen.getByRole('button', { name: /alternar tema/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('renderiza a sidebar com os links de navegação principais', () => {
    renderWithProviders(
      <AppLayout>
        <div>Conteúdo Principal</div>
      </AppLayout>
    );

    // Navigation links na Sidebar
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pdv/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /estoque/i })).toBeInTheDocument();
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
