import { useState, useEffect, useMemo } from 'react';
import { useCustomers, ListCustomersInput } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/domain/CustomerTable';
import { CustomerForm } from '@/components/domain/CustomerForm';
import { CustomerFilters } from '@/components/domain/CustomerFilters';
import { ConfirmDeleteModal } from '@/components/domain/ConfirmDeleteModal';
import { CustomerProfile } from '@/components/domain/CustomerProfile';
import { useToast } from '@/hooks/useToast';
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

  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string } | null>(null);
  
  const [filters, setFilters] = useState<ListCustomersInput>({
    page: 1,
    pageSize: 25,
  });

  useEffect(() => {
    listCustomers(filters);
  }, []);

  const handleApplyFilters = async (newFilters: ListCustomersInput) => {
    const updatedFilters = { ...newFilters, page: 1, pageSize: 25 };
    setFilters(updatedFilters);
    await listCustomers(updatedFilters);
  };

  const handleClearFilters = async () => {
    const emptyFilters: ListCustomersInput = { page: 1, pageSize: 25 };
    setFilters(emptyFilters);
    await listCustomers(emptyFilters);
  };

  const handleCreateClick = () => {
    setSelectedCustomerId(null);
    setShowForm(true);
  };

  const handleEditClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowForm(true);
  };

  const handleViewDetails = (customerId: string) => {
    setViewingCustomerId(customerId);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomerId(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedCustomerId) {
        await updateCustomer(selectedCustomerId, data);
        addToast({ type: 'success', message: 'Cliente atualizado com sucesso!' });
      } else {
        await createCustomer(data);
        addToast({ type: 'success', message: 'Cliente criado com sucesso!' });
      }

      handleFormClose();
      await listCustomers(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cliente';
      addToast({ type: 'error', message });
    }
  };

  const handleDeleteClick = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setDeletingCustomer({ id: customer.id, name: customer.name });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    try {
      await deleteCustomer(deletingCustomer.id);
      addToast({ type: 'success', message: 'Cliente deletado com sucesso!' });
      setDeletingCustomer(null);
      await listCustomers(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      addToast({ type: 'error', message });
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

  // Memoized order counts (ideally this comes from the list API, but we'll mock for now if missing)
  // In a real scenario, the list endpoint should return activeOrderCount
  const activeOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      // Assuming the API might provide this in the future or we have it cached
      counts[c.id] = 0; 
    });
    return counts;
  }, [customers]);

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
            onViewDetails={handleViewDetails}
            activeOrderCounts={activeOrderCounts}
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

      {deletingCustomer && (
        <ConfirmDeleteModal
          customerName={deletingCustomer.name}
          activeOrderCount={activeOrderCounts[deletingCustomer.id] || 0}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCustomer(null)}
        />
      )}

      {viewingCustomerId && (
        <CustomerProfile
          customerId={viewingCustomerId}
          getCustomer={getCustomer}
          onClose={() => setViewingCustomerId(null)}
        />
      )}
    </div>
  );
}
