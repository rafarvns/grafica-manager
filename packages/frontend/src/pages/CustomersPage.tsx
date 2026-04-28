import { useState, useEffect } from 'react';
import { useCustomers, ListCustomersInput } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/domain/CustomerTable';
import { CustomerForm } from '@/components/domain/CustomerForm';
import { CustomerFilters } from '@/components/domain/CustomerFilters';
import styles from './CustomersPage.module.css';

export function CustomersPage() {
  const {
    customers,
    pagination,
    loading,
    error,
    listCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
  } = useCustomers();

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListCustomersInput>({
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    listCustomers(filters);
  }, []);

  const handleApplyFilters = async (newFilters: ListCustomersInput) => {
    setFilters({ ...newFilters, page: 1 });
    await listCustomers({ ...newFilters, page: 1 });
  };

  const handleClearFilters = async () => {
    const emptyFilters: ListCustomersInput = { page: 1, pageSize: 10 };
    setFilters(emptyFilters);
    await listCustomers(emptyFilters);
  };

  const handleCreateClick = () => {
    setSelectedCustomerId(null);
    setShowForm(true);
    setFormError(null);
  };

  const handleEditClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowForm(true);
    setFormError(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomerId(null);
    setFormError(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormError(null);
      setFormSuccess(null);

      if (selectedCustomerId) {
        await updateCustomer(selectedCustomerId, data);
        setFormSuccess('Cliente atualizado com sucesso!');
      } else {
        await createCustomer(data);
        setFormSuccess('Cliente criado com sucesso!');
      }

      handleFormClose();
      await listCustomers(filters);
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cliente';
      setFormError(message);
    }
  };

  const handleDeleteClick = async (customerId: string) => {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja deletar este cliente?'
    );
    if (!confirmDelete) return;

    try {
      await deleteCustomer(customerId);
      setFormSuccess('Cliente deletado com sucesso!');
      await listCustomers(filters);
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      setFormError(message);
    }
  };

  const handlePreviousPage = async () => {
    const newFilters = {
      ...filters,
      page: Math.max(1, (filters.page || 1) - 1),
    };
    setFilters(newFilters);
    await listCustomers(newFilters);
  };

  const handleNextPage = async () => {
    const newFilters = {
      ...filters,
      page: ((filters.page || 1) + 1),
    };
    setFilters(newFilters);
    await listCustomers(newFilters);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Clientes</h1>
        <button
          className={styles.createButton}
          onClick={handleCreateClick}
          data-testid="create-customer-button"
        >
          + Novo Cliente
        </button>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      {formError && (
        <div
          className={styles.formErrorMessage}
          data-testid="customer-error-message"
          role="alert"
        >
          {formError}
        </div>
      )}

      {formSuccess && (
        <div
          className={styles.formSuccessMessage}
          data-testid="customer-success-message"
          role="alert"
        >
          {formSuccess}
        </div>
      )}

      <CustomerFilters onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading && (
        <div className={styles.loadingSpinner} data-testid="loading-spinner">
          <div className={styles.spinner} />
          <span>Carregando clientes...</span>
        </div>
      )}

      {!loading && customers.length === 0 && (
        <div className={styles.emptyState} data-testid="empty-customers-state">
          <p>Nenhum cliente encontrado.</p>
        </div>
      )}

      {!loading && customers.length > 0 && (
        <>
          <CustomerTable
            customers={customers}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />

          <div className={styles.pagination}>
            <button
              onClick={handlePreviousPage}
              disabled={pagination.page <= 1}
              className={styles.paginationButton}
            >
              ← Anterior
            </button>

            <span className={styles.pageIndicator} data-testid="current-page">
              Página {pagination.page} de{' '}
              {Math.ceil(pagination.total / pagination.pageSize)}
            </span>

            <button
              onClick={handleNextPage}
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
              className={styles.paginationButton}
              data-testid="next-page-button"
            >
              Próxima →
            </button>
          </div>
        </>
      )}

      {showForm && (
        <CustomerForm
          customerId={selectedCustomerId}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          getCustomer={getCustomer}
        />
      )}
    </div>
  );
}
