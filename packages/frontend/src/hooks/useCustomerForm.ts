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

  const formRef = useRef<CustomerFormData>(form);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastCheckedEmail = useRef<string>('');

  const updateField = useCallback(
    (field: keyof CustomerFormData, value: string) => {
      let trimmedValue = value;
      if (field === 'name' || field === 'email') {
        trimmedValue = value.trim();
      }

      formRef.current = { ...formRef.current, [field]: trimmedValue };
      setForm(formRef.current);

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
    const currentForm = formRef.current;
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!currentForm.name) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!currentForm.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(currentForm.email)) {
      newErrors.email = 'Email inválido';
    }

    if (currentForm.zipCode && !isValidZipCode(currentForm.zipCode)) {
      newErrors.zipCode = 'CEP deve estar no formato 00000-000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = Boolean(
    formRef.current.name &&
    formRef.current.email &&
    isValidEmail(formRef.current.email)
  );

  const reset = useCallback(() => {
    const empty: CustomerFormData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    };
    setForm(empty);
    formRef.current = empty;
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
