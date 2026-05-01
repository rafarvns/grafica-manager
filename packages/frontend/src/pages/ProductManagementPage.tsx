import React, { useEffect } from 'react';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import styles from './ManagementPages.module.css';

export function ProductManagementPage() {
  const {
    priceTable,
    paperTypes,
    loading,
    error,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
    fetchPriceTable,
    fetchPaperTypes,
  } = usePrintHistory();

  useEffect(() => {
    fetchPriceTable();
    fetchPaperTypes();
  }, [fetchPriceTable, fetchPaperTypes]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cadastro de Produtos (Tabela de Preços)</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {loading && !priceTable.length ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <PriceTableManager
            priceTable={priceTable}
            paperTypes={paperTypes}
            onPricesUpdated={fetchPriceTable}
            onCreate={(name, description, friendlyCode, paperTypeId, quality, colors, unitPrice, maxPages) =>
              createPriceEntry(name, description, friendlyCode, paperTypeId, quality, colors, unitPrice, maxPages)
            }
            onUpdate={(id, unitPrice, name, description, maxPages) => updatePriceEntry(id, { unitPrice, name, description, maxPages })}
            onDelete={deletePriceEntry}
          />
        )}
      </div>
    </div>
  );
}
