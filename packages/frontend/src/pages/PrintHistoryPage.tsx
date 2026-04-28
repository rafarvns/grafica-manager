import { useState } from 'react';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import { PrintHistoryFilters } from '@/components/domain/PrintHistoryFilters';
import { PrintHistoryTable } from '@/components/domain/PrintHistoryTable';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import { PrintJobDetailsPanel } from '@/components/domain/PrintJobDetailsPanel';
import { PrintFilters, PrintJob } from '@/hooks/usePrintHistory';
import styles from './PrintHistoryPage.module.css';

export function PrintHistoryPage() {
  const {
    printJobs,
    priceTable,
    loading,
    error,
    filters,
    setFilters,
    fetchPrintHistory,
    fetchPriceTable,
    getTotalCost,
    getSuccessRate,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
  } = usePrintHistory();

  const [activeTab, setActiveTab] = useState<'history' | 'prices'>('history');
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleApplyFilters = async (newFilters: PrintFilters) => {
    setFilters(newFilters);
    await fetchPrintHistory(newFilters);
  };

  const handleClearFilters = async () => {
    setFilters({});
    await fetchPrintHistory({});
  };

  const handleJobClick = (job: PrintJob) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedJob(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Histórico de Impressões</h1>
        <div className={styles.indicators}>
          <div
            className={styles.indicator}
            data-testid="total-cost-indicator"
          >
            <span className={styles.label}>Custo Total:</span>
            <span className={styles.value}>
              R$ {getTotalCost(printJobs).toFixed(2)}
            </span>
          </div>
          <div
            className={styles.indicator}
            data-testid="success-rate-indicator"
          >
            <span className={styles.label}>Taxa de Sucesso:</span>
            <span className={styles.value}>
              {getSuccessRate(printJobs).toFixed(2)}%
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Histórico de Impressões
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'prices' ? styles.active : ''}`}
          onClick={() => setActiveTab('prices')}
          data-testid="price-table-tab"
        >
          Tabela de Preços
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'history' ? (
          <div className={styles.historySection}>
            <PrintHistoryFilters
              filters={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              loading={loading}
            />

            {loading && (
              <div
                className={styles.loadingSpinner}
                data-testid="loading-spinner"
              >
                <div className={styles.spinner} />
                <span>Carregando...</span>
              </div>
            )}

            {!loading && (
              <PrintHistoryTable
                jobs={printJobs}
                onJobClick={handleJobClick}
              />
            )}
          </div>
        ) : (
          <PriceTableManager
            priceTable={priceTable}
            onPricesUpdated={fetchPriceTable}
            onCreate={createPriceEntry}
            onUpdate={updatePriceEntry}
            onDelete={deletePriceEntry}
          />
        )}
      </div>

      {detailsOpen && selectedJob && (
        <PrintJobDetailsPanel
          job={selectedJob}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
