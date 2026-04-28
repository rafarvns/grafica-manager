import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomerForm } from '@/hooks/useCustomerForm';

const mockCheckEmailUnique = vi.fn();

describe('useCustomerForm', () => {
  describe('form initialization', () => {
    it('initializes with empty form', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));
      expect(result.current.form).toEqual({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
      });
    });

    it('initializes with provided values', () => {
      const initial = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        address: 'Rua A',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      };
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique, initial));
      expect(result.current.form).toEqual(initial);
    });
  });

  describe('form updates', () => {
    it('updates form field', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'Maria');
      });

      expect(result.current.form.name).toBe('Maria');
    });

    it('trims name and email on update', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', '  João  ');
        result.current.updateField('email', '  joao@example.com  ');
      });

      expect(result.current.form.name).toBe('João');
      expect(result.current.form.email).toBe('joao@example.com');
    });
  });

  describe('validation', () => {
    it('validates required fields', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.name).toBeTruthy();
      expect(result.current.errors.email).toBeTruthy();
    });

    it('validates email format', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'invalid-email');
        result.current.validate();
      });

      expect(result.current.errors.email).toBeTruthy();
    });

    it('accepts valid email format', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'joao@example.com');
        result.current.validate();
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('validates zipCode format if provided', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'joao@example.com');
        result.current.updateField('zipCode', 'invalid');
        result.current.validate();
      });

      expect(result.current.errors.zipCode).toBeTruthy();
    });

    it('accepts valid zipCode format', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'joao@example.com');
        result.current.updateField('zipCode', '01000-000');
        result.current.validate();
      });

      expect(result.current.errors.zipCode).toBeUndefined();
    });
  });

  describe('email uniqueness check', () => {
    it('checks email uniqueness on blur with debounce', async () => {
      mockCheckEmailUnique.mockResolvedValue(true);
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('email', 'joao@example.com');
      });

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(mockCheckEmailUnique).toHaveBeenCalledWith('joao@example.com');
    });

    it('sets email error if not unique', async () => {
      mockCheckEmailUnique.mockResolvedValue(false);
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('email', 'existing@example.com');
      });

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(result.current.errors.email).toBe('Email já cadastrado');
    });
  });

  describe('isValid flag', () => {
    it('returns false when required fields are empty', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));
      expect(result.current.isValid).toBe(false);
    });

    it('returns true when required fields are filled and valid', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'joao@example.com');
      });

      expect(result.current.isValid).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets form to empty', () => {
      const { result } = renderHook(() => useCustomerForm(mockCheckEmailUnique));

      act(() => {
        result.current.updateField('name', 'João');
        result.current.updateField('email', 'joao@example.com');
        result.current.reset();
      });

      expect(result.current.form.name).toBe('');
      expect(result.current.form.email).toBe('');
    });
  });
});
