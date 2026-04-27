import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card/Card';

describe('Card Component', () => {
  it('renderiza o Card com seus subcomponentes', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <h2>Título do Card</h2>
        </CardHeader>
        <CardContent>
          <p>Conteúdo principal</p>
        </CardContent>
        <CardFooter>
          <button>Ação</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Título do Card')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo principal')).toBeInTheDocument();
    expect(screen.getByText('Ação')).toBeInTheDocument();
  });

  it('aplica classes adicionais de forma flexível', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header" />
        <CardContent className="custom-content" />
        <CardFooter className="custom-footer" />
      </Card>
    );

    const card = document.querySelector('.custom-card');
    const header = document.querySelector('.custom-header');
    const content = document.querySelector('.custom-content');
    const footer = document.querySelector('.custom-footer');

    expect(card).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });

  it('não possui violações de acessibilidade', async () => {
    const { container } = render(
      <Card>
        <CardHeader><h2>Teste A11y</h2></CardHeader>
        <CardContent><p>Acessibilidade é importante.</p></CardContent>
      </Card>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
