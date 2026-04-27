import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RouterProvider, Route, useRouter } from '@/router/HashRouter';

// Componente para testar navegação programática
function NavTest() {
  const { navigate, currentPath } = useRouter();
  return (
    <div>
      <span data-testid="path">{currentPath}</span>
      <button onClick={() => navigate('/settings')}>Ir para config</button>
    </div>
  );
}

describe('HashRouter', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza o componente padrão quando hash está vazio', () => {
    render(
      <RouterProvider>
        <Route path="/" component={<div>Página Inicial</div>} />
        <Route path="/settings" component={<div>Configurações</div>} />
      </RouterProvider>
    );

    expect(screen.getByText('Página Inicial')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('renderiza o componente correto baseado no hash inicial', () => {
    window.location.hash = '#/settings';
    
    render(
      <RouterProvider>
        <Route path="/" component={<div>Página Inicial</div>} />
        <Route path="/settings" component={<div>Configurações</div>} />
      </RouterProvider>
    );

    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('atualiza a rota quando o evento hashchange é disparado', () => {
    render(
      <RouterProvider>
        <Route path="/" component={<div>Página Inicial</div>} />
        <Route path="/pdv" component={<div>PDV</div>} />
      </RouterProvider>
    );

    expect(screen.getByText('Página Inicial')).toBeInTheDocument();

    act(() => {
      window.location.hash = '#/pdv';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByText('PDV')).toBeInTheDocument();
    expect(screen.queryByText('Página Inicial')).not.toBeInTheDocument();
  });

  it('permite navegação programática via useRouter', () => {
    render(
      <RouterProvider>
        <Route path="/" component={<NavTest />} />
        <Route path="/settings" component={<NavTest />} />
      </RouterProvider>
    );

    expect(screen.getByTestId('path').textContent).toBe('/');

    act(() => {
      screen.getByText('Ir para config').click();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByTestId('path').textContent).toBe('/settings');
    expect(window.location.hash).toBe('#/settings');
  });

  it('renderiza null se nenhuma rota der match e não houver fallback (ou lida com 404 futuramente)', () => {
    const { container } = render(
      <RouterProvider>
        <Route path="/home" component={<div>Home</div>} />
      </RouterProvider>
    );
    
    // Hash é vazio, logo path é '/', que não tem match com '/home'
    expect(container.firstChild).toBeNull();
  });
});
