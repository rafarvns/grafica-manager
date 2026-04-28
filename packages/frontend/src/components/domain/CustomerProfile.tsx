import React, { useState, useEffect } from 'react';
import { CustomerDetail } from '@/hooks/useCustomers';
import styles from './CustomerProfile.module.css';

interface CustomerProfileProps {
  customerId: string;
  getCustomer: (id: string) => Promise<CustomerDetail | null>;
  onClose: () => void;
}

export function CustomerProfile({
  customerId,
  getCustomer,
  onClose,
}: CustomerProfileProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCustomer(customerId);
        setCustomer(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [customerId, getCustomer]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.drawer}
        data-testid="customer-profile"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <div className={styles.header}>
          <h2 id="profile-title">Perfil do Cliente</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.loading} data-testid="loading-spinner">
            <div className={styles.spinner} />
            <span>Carregando dados do cliente...</span>
          </div>
        ) : customer ? (
          <div className={styles.content}>
            <section className={styles.section}>
              <h3>Informações de Contato</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Nome</label>
                  <span>{customer.name}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <span>{customer.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Telefone</label>
                  <span>{customer.phone || '-'}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3>Endereço</h3>
              <div className={styles.addressBox}>
                <p>{customer.address || 'Sem endereço cadastrado'}</p>
                <p>
                  {customer.city && `${customer.city}${customer.state ? ` - ${customer.state}` : ''}`}
                </p>
                <p>{customer.zipCode}</p>
              </div>
            </section>

            <section className={styles.section} data-testid="customer-order-summary">
              <h3>Resumo de Pedidos</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <label>Total</label>
                  <span className={styles.value}>{customer.orderSummary.total}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Ativos</label>
                  <span className={styles.value}>{customer.orderSummary.active}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Concluídos</label>
                  <span className={styles.value}>{customer.orderSummary.completed}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Total Gasto</label>
                  <span className={styles.valueHighlight}>
                    R$ {customer.orderSummary.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            {customer.notes && (
              <section className={styles.section}>
                <h3>Observações</h3>
                <p className={styles.notes}>{customer.notes}</p>
              </section>
            )}
          </div>
        ) : (
          <div className={styles.error}>
            <p>Erro ao carregar os dados do cliente.</p>
          </div>
        )}
      </div>
    </>
  );
}
