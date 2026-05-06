export type ManualDuplexFlip = 'long' | 'short';
export type EvenPagesOrder = 'normal' | 'reverse';

export interface ManualDuplexPasses {
  pass1: number[];
  pass2: number[];
  hasOrphanLastPage: boolean;
}

export function computeManualDuplexPasses(
  totalPages: number,
  evenOrder: EvenPagesOrder = 'normal'
): ManualDuplexPasses {
  const pass1: number[] = [];
  const pass2: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i % 2 === 1) pass1.push(i);
    else pass2.push(i);
  }
  if (evenOrder === 'reverse') pass2.reverse();
  return {
    pass1,
    pass2,
    hasOrphanLastPage: totalPages > 0 && totalPages % 2 === 1,
  };
}

export function formatPagesParam(pages: number[]): string {
  return pages.join(',');
}
