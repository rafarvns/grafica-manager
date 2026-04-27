import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';

// Wrapper para testar abas controladas facilmente
function TabsTestWrapper() {
  const [activeTab, setActiveTab] = useState('tab1');
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList aria-label="Abas de teste">
        <TabsTrigger value="tab1">Aba 1</TabsTrigger>
        <TabsTrigger value="tab2">Aba 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Conteúdo da Aba 1</TabsContent>
      <TabsContent value="tab2">Conteúdo da Aba 2</TabsContent>
    </Tabs>
  );
}

describe('Interactive Components', () => {
  describe('Tabs', () => {
    it('renderiza as abas e o conteúdo inicial corretamente', () => {
      render(<TabsTestWrapper />);
      
      expect(screen.getByRole('tab', { name: 'Aba 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Aba 2' })).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteúdo da Aba 1');
      expect(screen.queryByText('Conteúdo da Aba 2')).not.toBeInTheDocument();
    });

    it('alterna o conteúdo ao clicar em uma aba e atualiza ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<TabsTestWrapper />);
      
      const tab2 = screen.getByRole('tab', { name: 'Aba 2' });
      await user.click(tab2);
      
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteúdo da Aba 2');
      expect(screen.queryByText('Conteúdo da Aba 1')).not.toBeInTheDocument();
      
      expect(tab2).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Aba 1' })).toHaveAttribute('aria-selected', 'false');
    });

    it('não possui violações de acessibilidade', async () => {
      const { container } = render(<TabsTestWrapper />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Tooltip', () => {
    it('renderiza o children providenciado', () => {
      render(
        <Tooltip content="Informação extra">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });

    it('possui o tooltip invisível no DOM com o atributo role tooltip', () => {
      render(
        <Tooltip content="Informação extra">
          <button>Hover me</button>
        </Tooltip>
      );
      // Pelo fato de ser baseado em CSS (group-hover), ele pode estar no DOM mas hidden via CSS.
      // Validamos a existência do texto.
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Informação extra');
    });

    it('não possui violações de acessibilidade', async () => {
      const { container } = render(
        <Tooltip content="Ajuda">
          <button>Hover</button>
        </Tooltip>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
