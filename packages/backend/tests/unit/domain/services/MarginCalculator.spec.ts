import { describe, it, expect } from 'vitest';
import { MarginCalculator } from '@/domain/services/MarginCalculator';

describe('MarginCalculator.grossMarginPercent', () => {
  it('calculates gross margin correctly', () => {
    expect(MarginCalculator.grossMarginPercent(100, 60)).toBe(40);
  });

  it('returns 0 when revenue is 0', () => {
    expect(MarginCalculator.grossMarginPercent(0, 0)).toBe(0);
  });

  it('returns 100 when cost is 0', () => {
    expect(MarginCalculator.grossMarginPercent(100, 0)).toBe(100);
  });

  it('returns 0 when cost equals revenue', () => {
    expect(MarginCalculator.grossMarginPercent(100, 100)).toBe(0);
  });

  it('returns negative margin when cost exceeds revenue', () => {
    expect(MarginCalculator.grossMarginPercent(80, 100)).toBeCloseTo(-25, 1);
  });

  it('handles decimal values', () => {
    expect(MarginCalculator.grossMarginPercent(200, 80)).toBe(60);
  });

  it('rounds to two decimal places', () => {
    const result = MarginCalculator.grossMarginPercent(100, 33);
    expect(result).toBe(67);
  });
});

describe('MarginCalculator.netMarginPercent', () => {
  it('calculates net margin correctly', () => {
    expect(MarginCalculator.netMarginPercent(100, 70)).toBe(30);
  });

  it('returns 0 when revenue is 0', () => {
    expect(MarginCalculator.netMarginPercent(0, 0)).toBe(0);
  });

  it('equals gross margin when totalCost equals printCost', () => {
    expect(MarginCalculator.netMarginPercent(100, 60)).toBe(
      MarginCalculator.grossMarginPercent(100, 60)
    );
  });

  it('is lower than gross margin when totalCost is higher', () => {
    const gross = MarginCalculator.grossMarginPercent(100, 60);
    const net = MarginCalculator.netMarginPercent(100, 80);
    expect(net).toBeLessThan(gross);
  });
});
