import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBreadcrumb } from '@/components/ui/Breadcrumb/useBreadcrumb';

describe('useBreadcrumb hook', () => {
  it('returns Home for root path', () => {
    const { result } = renderHook(() => useBreadcrumb('/'));
    expect(result.current).toEqual([{ label: 'Home', path: '/' }]);
  });

  it('parses single segment path', () => {
    const { result } = renderHook(() => useBreadcrumb('/clientes'));
    expect(result.current).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Clientes', path: '/clientes' },
    ]);
  });

  it('parses multi-segment path', () => {
    const { result } = renderHook(() => useBreadcrumb('/pedidos/ORD-001'));
    expect(result.current).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Pedidos', path: '/pedidos' },
      { label: 'ORD-001', path: '/pedidos/ORD-001' },
    ]);
  });

  it('translates menu labels correctly', () => {
    const translations: Record<string, string> = {
      'clientes': 'Clientes',
      'pedidos': 'Pedidos',
      'impressoes': 'Impressões',
      'relatorios': 'Relatórios',
      'configuracoes': 'Configurações',
    };

    Object.entries(translations).forEach(([path, label]) => {
      const { result } = renderHook(() => useBreadcrumb(`/${path}`));
      expect(result.current[1]?.label).toBe(label);
    });
  });

  it('uses segment itself as label if no translation found', () => {
    const { result } = renderHook(() => useBreadcrumb('/unknown-page'));
    expect(result.current).toEqual([
      { label: 'Home', path: '/' },
      { label: 'unknown-page', path: '/unknown-page' },
    ]);
  });

  it('handles trailing slash', () => {
    const { result } = renderHook(() => useBreadcrumb('/clientes/'));
    expect(result.current).toEqual([
      { label: 'Home', path: '/' },
      { label: 'Clientes', path: '/clientes' },
    ]);
  });
});
