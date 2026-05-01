import React, { useState } from 'react';
import { useReports, ReportGrouping, PageSize, ReportFilters } from '@/hooks/useReports';
import { ReportsTabs } from '@/components/domain/ReportsTabs';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './ReportsPage.module.css';

const GROUPING_LABELS: Record<ReportGrouping, string> = {
  none: 'Sem agrupamento',
  customer: 'Por cliente',
  order: 'Por pedido',
  paper: 'Por papel',
  origin: 'Por origem',
};

const PAGE_SIZE_OPTIONS: PageSize[] = [25, 50, 100];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR');
}

export function ReportsPage() {
  const { data, loading, error, generate, exportCsv, exportExcel, exportPdf, changePage } =
    useReports();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [grouping, setGrouping] = useState<ReportGrouping>('none');
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [validationError, setValidationError] = useState<string | null>(null);

  const buildFilters = (): ReportFilters | null => {
    if (!from || !to) {
      setValidationError('Selecione um período para gerar o relatório');
      return null;
    }
    setValidationError(null);
    return { startDate: from, endDate: to, grouping, pageSize };
  };

  const handleGenerate = () => {
    const filters = buildFilters();
    if (filters) void generate(filters);
  };

  const handleExportCsv = async () => {
    const filters = buildFilters();
    if (filters) await exportCsv(filters);
  };

  const handleExportExcel = async () => {
    const filters = buildFilters();
    if (filters) await exportExcel(filters);
  };

  const handleExportPdf = async () => {
    const filters = buildFilters();
    if (filters) await exportPdf(filters);
  };

  const totalPages = data
    ? Math.ceil(data.pagination.totalCount / data.pagination.pageSize)
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
      </header>
      <ReportsTabs />

      <section className={styles.filters} aria-label="Filtros do relatório">
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="report-from" className={styles.label}>
              Data inicial <span aria-hidden="true">*</span>
            </label>
            <input
              id="report-from"
              type="date"
              className={styles.input}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="report-to" className={styles.label}>
              Data final <span aria-hidden="true">*</span>
            </label>
            <input
              id="report-to"
              type="date"
              className={styles.input}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="report-grouping" className={styles.label}>
              Agrupar por
            </label>
            <select
              id="report-grouping"
              className={styles.select}
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as ReportGrouping)}
            >
              {(Object.keys(GROUPING_LABELS) as ReportGrouping[]).map((g) => (
                <option key={g} value={g}>
                  {GROUPING_LABELS[g]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="report-page-size" className={styles.label}>
              Linhas por página
            </label>
            <select
              id="report-page-size"
              className={styles.select}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
            >
              {PAGE_SIZE_OPTIONS.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(validationError ?? error) && (
          <p role="alert" className={styles.error}>
            {validationError ?? error}
          </p>
        )}

        <div className={styles.actions}>
          <Button onClick={handleGenerate} isLoading={loading} variant="primary">
            Gerar relatório
          </Button>
          <Button onClick={handleExportCsv} variant="secondary" disabled={!data}>
            Exportar CSV
          </Button>
          <Button onClick={handleExportExcel} variant="secondary" disabled={!data}>
            Exportar Excel
          </Button>
          <Button onClick={handleExportPdf} variant="secondary" disabled={!data}>
            Exportar PDF
          </Button>
        </div>
      </section>

      {loading && !data && (
        <div className={styles.loadingCenter}>
          <Spinner />
        </div>
      )}

      {data && (
        <section aria-label="Resultado do relatório">
          <div className={styles.totals}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Pedidos</span>
              <span className={styles.totalValue}>{data.totals.totalOrders}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Receita</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.totalRevenue)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Custo</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.totalCost)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Margem</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.totalMargin)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Margem %</span>
              <span className={styles.totalValue}>{formatPercent(data.totals.marginPercent)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Ticket Médio</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.ticketAverage)}</span>
            </div>
          </div>

          <p className={styles.summary}>
            {data.pagination.totalCount} resultado{data.pagination.totalCount !== 1 ? 's' : ''} ·
            Página {data.pagination.page} de {totalPages}
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Pedido</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Papel</th>
                  <th scope="col">Qtde</th>
                  <th scope="col">Venda</th>
                  <th scope="col">Custo</th>
                  <th scope="col">Margem</th>
                  <th scope="col">Margem %</th>
                  <th scope="col">Origem</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      Nenhum resultado para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.orderId}>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.orderNumber}</td>
                      <td>{row.customerName}</td>
                      <td>{row.paperType}</td>
                      <td>{row.quantity.toLocaleString('pt-BR')}</td>
                      <td>{formatCurrency(row.salePrice)}</td>
                      <td>{formatCurrency(row.cost)}</td>
                      <td>{formatCurrency(row.margin)}</td>
                      <td>{formatPercent(row.marginPercent)}</td>
                      <td>
                        <span className={row.origin === 'SHOPEE' ? styles.tagShopee : styles.tagManual}>
                          {row.origin === 'SHOPEE' ? 'Shopee' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginação">
              <Button
                variant="secondary"
                onClick={() => changePage(data.pagination.page - 1)}
                disabled={data.pagination.page <= 1}
                aria-label="Página anterior"
              >
                ←
              </Button>
              <span className={styles.pageInfo}>
                {data.pagination.page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => changePage(data.pagination.page + 1)}
                disabled={data.pagination.page >= totalPages}
                aria-label="Próxima página"
              >
                →
              </Button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
