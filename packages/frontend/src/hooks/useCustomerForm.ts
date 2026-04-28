import { useState, useCallback, useRef, useEffect } from 'react';

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export function useCustomerForm(
  checkEmailUnique: (email: string) => Promise<boolean>,
  initialValues?: Partial<CustomerFormData>
) {
  const [form, setForm] = useState<CustomerFormData>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    city: initialValues?.city ?? '',
    state: initialValues?.state ?? '',
    zipCode: initialValues?.zipCode ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const debounceTimer = useRef<NodeJS.Timeout>();
  const lastCheckedEmail = useRef<string>('');

  const updateField = useCallback(
    (field: keyof CustomerFormData, value: string) => {
      let trimmedValue = value;
      if (field === 'name' || field === 'email') {
        trimmedValue = value.trim();
      }

      setForm((prev) => ({ ...prev, [field]: trimmedValue }));

      // Email uniqueness check with debounce
      if (field === 'email' && trimmedValue !== lastCheckedEmail.current) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
          if (trimmedValue) {
            const isUnique = await checkEmailUnique(trimmedValue);
            if (!isUnique) {
              setErrors((prev) => ({ ...prev, email: 'Email já cadastrado' }));
            } else {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
              });
            }
          }
          lastCheckedEmail.current = trimmedValue;
        }, 300);
      }
    },
    [checkEmailUnique]
  );

  const validate = () => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!form.name) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!form.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Email inválido';
    }

    if (form.zipCode && !isValidZipCode(form.zipCode)) {
      newErrors.zipCode = 'CEP deve estar no formato 00000-000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = Boolean(form.name && form.email && isValidEmail(form.email));

  const reset = useCallback(() => {
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    });
    setErrors({});
    lastCheckedEmail.current = '';
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { form, errors, updateField, validate, isValid, reset };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}-\d{3}$/.test(zipCode);
}
