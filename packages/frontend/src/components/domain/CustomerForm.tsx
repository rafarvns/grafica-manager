import { useState, useEffect, useCallback } from 'react';
import { CustomerDetail, UpdateCustomerInput, CreateCustomerInput } from '@/hooks/useCustomers';
import { useCustomerForm } from '@/hooks/useCustomerForm';
import { apiClient } from '@/services/apiClient';
import styles from './CustomerForm.module.css';

interface CustomerFormProps {
  customerId: string | null;
  onSubmit: (data: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  onClose: () => void;
  getCustomer: (id: string) => Promise<CustomerDetail | null>;
}

export function CustomerForm({
  customerId,
  onSubmit,
  onClose,
  getCustomer,
}: CustomerFormProps) {
  const [loading, setLoading] = useState(!!customerId);
  const [submitting, setSubmitting] = useState(false);

  const checkEmailUnique = useCallback(async (email: string) => {
    try {
      const response = await apiClient.get<boolean>(`/api/customers/check-email?email=${encodeURIComponent(email)}${customerId ? `&excludeId=${customerId}` : ''}`);
      return response.data;
    } catch {
      return true; // Se der erro no check, assume que pode tentar salvar
    }
  }, [customerId]);

  const { form, errors, updateField, validate, reset } = useCustomerForm(checkEmailUnique);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    } else {
      reset();
    }
  }, [customerId, reset]);

  const loadCustomer = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const customer = await getCustomer(customerId);
      if (customer) {
        updateField('name', customer.name);
        updateField('email', customer.email);
        updateField('phone', customer.phone || '');
        updateField('address', customer.address || '');
        updateField('city', customer.city || '');
        updateField('state', customer.state || '');
        updateField('zipCode', customer.zipCode || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      const data = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zipCode: form.zipCode || null,
      };

      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.modal}
        data-testid="customer-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
      >
        <div className={styles.header}>
          <h2 id="customer-form-title">
            {customerId ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Carregando cliente...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formContent}>
              <div className={styles.columns}>
              <div className={styles.section}>
                <h3>Informações Básicas</h3>

                <div className={styles.formField}>
                  <label htmlFor="name">Nome *</label>
                  <input
                    id="name"
                    type="text"
                    data-testid="customer-name-input"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    disabled={submitting}
                    className={errors.name ? styles.inputError : ''}
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    data-testid="customer-email-input"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={submitting}
                    className={errors.email ? styles.inputError : ''}
                  />
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    type="tel"
                    data-testid="customer-phone-input"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h3>Endereço</h3>

                <div className={styles.formField}>
                  <label htmlFor="address">Endereço</label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="city">Cidade</label>
                    <input
                      id="city"
                      type="text"
                      data-testid="customer-city-input"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="state">Estado</label>
                    <input
                      id="state"
                      type="text"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                      placeholder="SP"
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="zipCode">CEP</label>
                    <input
                      id="zipCode"
                      type="text"
                      value={form.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      placeholder="00000-000"
                      disabled={submitting}
                      className={errors.zipCode ? styles.inputError : ''}
                    />
                    {errors.zipCode && <span className={styles.errorMessage}>{errors.zipCode}</span>}
                  </div>
                </div>
              </div>
              </div>{/* .columns */}

            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
                data-testid="submit-customer-form"
              >
                {submitting ? 'Salvando...' : customerId ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={submitting}
                data-testid="cancel-customer-form"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
