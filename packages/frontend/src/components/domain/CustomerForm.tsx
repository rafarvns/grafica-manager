import { useState, useEffect } from 'react';
import { CustomerDetail, UpdateCustomerInput, CreateCustomerInput } from '@/hooks/useCustomers';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [orderSummary, setOrderSummary] = useState<any>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const customer = await getCustomer(customerId);
      if (customer) {
        setName(customer.name);
        setEmail(customer.email);
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setCity(customer.city || '');
        setState(customer.state || '');
        setZipCode(customer.zipCode || '');
        setNotes(customer.notes || '');
        setOrderSummary(customer.orderSummary);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const data = {
        name,
        email,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        notes: notes || undefined,
      };

      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal} data-testid="customer-form">
        <div className={styles.header}>
          <h2>{customerId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
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
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formContent}>
              <div className={styles.section}>
                <h3>Informações Básicas</h3>

                <div className={styles.formField}>
                  <label htmlFor="name">Nome *</label>
                  <input
                    id="name"
                    type="text"
                    data-testid="customer-name-input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    data-testid="customer-email-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    type="tel"
                    data-testid="customer-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="state">Estado</label>
                    <input
                      id="state"
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="zipCode">CEP</label>
                    <input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="00000-000"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Observações</h3>

                <div className={styles.formField}>
                  <label htmlFor="notes">Notas</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
              </div>

              {orderSummary && (
                <div className={styles.section} data-testid="customer-order-summary">
                  <h3>Resumo de Pedidos</h3>

                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total</span>
                      <span
                        className={styles.summaryValue}
                        data-testid="total-orders"
                      >
                        {orderSummary.total}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Ativos</span>
                      <span className={styles.summaryValue}>
                        {orderSummary.active}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Concluídos</span>
                      <span className={styles.summaryValue}>
                        {orderSummary.completed}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Cancelados</span>
                      <span className={styles.summaryValue}>
                        {orderSummary.cancelled}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Valor Total</span>
                      <span className={styles.summaryValue}>
                        R$ {orderSummary.totalValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
