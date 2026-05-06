import { describe, it, expect } from 'vitest';
import { computeManualDuplexPasses, formatPagesParam } from '@/utils/manualDuplex';

describe('computeManualDuplexPasses', () => {
  it('separa ímpares e pares para doc com número par de páginas', () => {
    const r = computeManualDuplexPasses(6);
    expect(r.pass1).toEqual([1, 3, 5]);
    expect(r.pass2).toEqual([2, 4, 6]);
    expect(r.hasOrphanLastPage).toBe(false);
  });

  it('marca orphan quando totalPages é ímpar', () => {
    const r = computeManualDuplexPasses(5);
    expect(r.pass1).toEqual([1, 3, 5]);
    expect(r.pass2).toEqual([2, 4]);
    expect(r.hasOrphanLastPage).toBe(true);
  });

  it('inverte pares quando evenOrder=reverse', () => {
    const r = computeManualDuplexPasses(6, 'reverse');
    expect(r.pass2).toEqual([6, 4, 2]);
  });

  it('lida com 1 página (pass1=[1], pass2=[], orphan)', () => {
    const r = computeManualDuplexPasses(1);
    expect(r.pass1).toEqual([1]);
    expect(r.pass2).toEqual([]);
    expect(r.hasOrphanLastPage).toBe(true);
  });

  it('lida com 0 páginas (vazio sem orphan)', () => {
    const r = computeManualDuplexPasses(0);
    expect(r.pass1).toEqual([]);
    expect(r.pass2).toEqual([]);
    expect(r.hasOrphanLastPage).toBe(false);
  });
});

describe('formatPagesParam', () => {
  it('junta com vírgula', () => {
    expect(formatPagesParam([1, 3, 5])).toBe('1,3,5');
  });
  it('vazio retorna string vazia', () => {
    expect(formatPagesParam([])).toBe('');
  });
});
