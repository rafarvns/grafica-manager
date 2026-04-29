import { useState, useEffect } from 'react';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import { PrintHistoryFilters } from '@/components/domain/PrintHistoryFilters';
import { PrintHistoryTable } from '@/components/domain/PrintHistoryTable';
import { PrintHistoryStats } from '@/components/domain/PrintHistoryStats';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import { PrintJobDetailsPanel } from '@/components/domain/PrintJobDetailsPanel';
import type { PrintJobDTO, PrintJobDetailDTO, PrintJobSortField, SortOrder, ExportFormat } from '@grafica/shared/types';
import styles from './PrintHistoryPage.module.css';

export function PrintHistoryPage() {
  const {
    printJobs,
    loading,
    error,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    sortBy,
    sortOrder,
    setSorting,
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    selectedJob,
    fetchPrintJobDetail,
    clearSelectedJob,
    reprocessJob,
    exportJobs,
    stats,
    priceTable,
    paperTypes,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
    fetchPriceTable,
    fetchPaperTypes,
    fetchStats,
  } = usePrintHistory();

  const [activeTab, setActiveTab] = useState<'history' | 'prices'>('history');
  const [showReprocessModal, setShowReprocessModal] = useState(false);
  const [reprocessJobId, setReprocessJobId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'prices') {
      fetchPriceTable();
      fetchPaperTypes();
    } else {
      fetchStats();
    }
  }, [activeTab, fetchPriceTable, fetchPaperTypes, fetchStats]);

  const handleJobClick = async (job: PrintJobDTO) => {
    await fetchPrintJobDetail(job.id);
  };

  const handleReprocess = (jobId: string) => {
    setReprocessJobId(jobId);
    setShowReprocessModal(true);
  };

  const handleReprocessConfirm = async () => {
    if (reprocessJobId) {
      await reprocessJob(reprocessJobId);
    }
    setShowReprocessModal(false);
    setReprocessJobId(null);
  };

  const handleReprocessCancel = () => {
    setShowReprocessModal(false);
    setReprocessJobId(null);
  };

  const handleViewDocument = (job: PrintJobDetailDTO) => {
    // TODO: Integrar com PDF Preview (spec 0006)
  };

  const handleSort = (field: PrintJobSortField) => {
    const newOrder: SortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSorting(field, newOrder);
  };

  const handleExport = async (format: ExportFormat) => {
    await exportJobs(format);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Histórico de Impressões</h1>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={styles.tabsContainer} role="tablist" aria-label="Seções do histórico">
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="history-panel"
          id="history-tab"
          onClick={() => setActiveTab('history')}
        >
          Histórico de Impressões
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'prices' ? styles.active : ''}`}
          role="tab"
          aria-selected={activeTab === 'prices'}
          aria-controls="prices-panel"
          id="prices-tab"
          data-testid="price-table-tab"
          onClick={() => setActiveTab('prices')}
        >
          Tabela de Preços
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'history' ? (
          <div className={styles.historySection} role="tabpanel" id="history-panel" aria-labelledby="history-tab">
            <PrintHistoryStats stats={stats} loading={loading} />

            <PrintHistoryFilters
              filters={filters}
              onApply={applyFilters}
              onClear={clearFilters}
              onFilterChange={setFilters}
              loading={loading}
            />

            <div className={styles.exportActions}>
              <button
                className={styles.exportButton}
                onClick={() => handleExport('csv')}
                disabled={loading}
                data-testid="export-csv-button"
              >
                Exportar CSV
              </button>
              <button
                className={styles.exportButton}
                onClick={() => handleExport('pdf')}
                disabled={loading}
                data-testid="export-pdf-button"
              >
                Exportar PDF
              </button>
            </div>

            {loading && (
              <div className={styles.loadingSpinner} data-testid="loading-spinner">
                <div className={styles.spinner} />
                <span>Carregando...</span>
              </div>
            )}

            {!loading && (
              <PrintHistoryTable
                jobs={printJobs}
                onJobClick={handleJobClick}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        ) : (
          <div role="tabpanel" id="prices-panel" aria-labelledby="prices-tab">
            <PriceTableManager
              priceTable={priceTable}
              paperTypes={paperTypes}
              onPricesUpdated={fetchPriceTable}
              onCreate={createPriceEntry}
              onUpdate={updatePriceEntry}
              onDelete={deletePriceEntry}
            />
          </div>
        )}
      </div>

      {selectedJob && (
        <PrintJobDetailsPanel
          job={selectedJob}
          onClose={clearSelectedJob}
          onReprocess={handleReprocess}
          onViewDocument={handleViewDocument}
        />
      )}

      {/* Modal de confirmação para reprocessar */}
      {showReprocessModal && (
        <div className={styles.modalOverlay} onClick={handleReprocessCancel}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="reprocess-title">
            <h3 id="reprocess-title">Reprocessar Impressão</h3>
            <p>Tem certeza que deseja reprocessar a impressão <strong>{reprocessJobId}</strong>?</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelButton} onClick={handleReprocessCancel} autoFocus>
                Cancelar
              </button>
              <button className={styles.modalConfirmButton} onClick={handleReprocessConfirm}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
