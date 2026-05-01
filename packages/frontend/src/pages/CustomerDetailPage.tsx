import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/router/HashRouter';
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb';
import { Card } from '@/components/ui/Card/Card';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { apiClient } from '@/services/apiClient';
import type { CustomerDetail } from '@/hooks/useCustomers';
import styles from './CustomerDetailPage.module.css';

export function CustomerDetailPage() {
  const { currentPath } = useRouter();
  const customerId = currentPath.split('/').pop() || '';

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    apiClient
      .get<CustomerDetail>(`/api/customers/${customerId}`)
      .then((r) => setCustomer(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar cliente'))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Spinner size="lg" label="Carregando cliente..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className={styles.centered}>
        <div className={styles.errorCard}>
          <h2>Erro ao carregar cliente</h2>
          <p>{error || 'Cliente não encontrado'}</p>
          <Link to="/clientes" className={styles.backLink}>← Voltar para clientes</Link>
        </div>
      </div>
    );
  }

  const totalGasto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    customer.orderSummary.totalValue
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Breadcrumb />
        <div className={styles.titleRow}>
          <h1 className={styles.name}>{customer.name}</h1>
          <Link to="/clientes" className={styles.backButton}>← Voltar para clientes</Link>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.grid}>
          <Card title="Informações de Contato">
            <div className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{customer.email}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Telefone</span>
                <span className={styles.value}>{customer.phone || '-'}</span>
              </div>
            </div>
          </Card>

          <Card title="Endereço">
            <div className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.label}>Logradouro</span>
                <span className={styles.value}>{customer.address || '-'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Cidade / Estado</span>
                <span className={styles.value}>
                  {customer.city
                    ? `${customer.city}${customer.state ? ` - ${customer.state}` : ''}`
                    : '-'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>CEP</span>
                <span className={styles.value}>{customer.zipCode || '-'}</span>
              </div>
            </div>
          </Card>

          <Card title="Resumo de Pedidos">
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total</span>
                <span className={styles.summaryValue}>{customer.orderSummary.total}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Ativos</span>
                <span className={styles.summaryValue}>{customer.orderSummary.active}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Concluídos</span>
                <span className={styles.summaryValue}>{customer.orderSummary.completed}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total Gasto</span>
                <span className={`${styles.summaryValue} ${styles.highlight}`}>{totalGasto}</span>
              </div>
            </div>
          </Card>

          {customer.notes && (
            <Card title="Observações">
              <p className={styles.notes}>{customer.notes}</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
