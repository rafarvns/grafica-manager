import { describe, it, expect } from 'vitest';
import { validateCNPJ } from '../../src/validators/cnpj.js';

describe('CNPJ Validator', () => {
  it('should return true for a valid CNPJ', () => {
    expect(validateCNPJ('00.000.000/0000-00')).toBe(true);
    expect(validateCNPJ('12.345.678/0001-90')).toBe(true);
  });

  it('should return false for an invalid format', () => {
    expect(validateCNPJ('00.000.000/0000-0')).toBe(false);
    expect(validateCNPJ('00.000.000/0000-000')).toBe(false);
    expect(validateCNPJ('00.000.000-0000-00')).toBe(false);
    expect(validateCNPJ('invalid.cnpj')).toBe(false);
    expect(validateCNPJ('')).toBe(false);
  });
});
