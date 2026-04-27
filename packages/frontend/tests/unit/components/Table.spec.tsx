import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table/Table';

describe('Table Component', () => {
  const renderSimpleTable = () => render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>João</TableCell>
          <TableCell>Ativo</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  it('renderiza corretamente a estrutura da tabela', () => {
    renderSimpleTable();
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(2);
    expect(columnHeaders[0].textContent).toBe('Nome');
    
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toBe('João');
  });

  it('permite a inclusão de caption para acessibilidade extra', () => {
    render(
      <Table>
        <caption>Lista de Usuários</caption>
        <TableBody>
          <TableRow><TableCell>Teste</TableCell></TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Lista de Usuários')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Lista de Usuários' })).toBeInTheDocument();
  });

  it('não possui violações de acessibilidade', async () => {
    const { container } = renderSimpleTable();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
