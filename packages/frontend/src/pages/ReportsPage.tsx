import React, { useState } from 'react';
import { useReports, ReportGrouping, PageSize, ReportFilters } from '@/hooks/useReports';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './ReportsPage.module.css';

const GROUPING_LABELS: Record<ReportGrouping, string> = {
  NONE: 'Sem agrupamento',
  CLIENT: 'Por cliente',
  PAPER: 'Por papel',
  ORIGIN: 'Por origem',
  PERIOD: 'Por período',
};

const PAGE_SIZE_OPTIONS: PageSize[] = [25, 50, 100];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ReportsPage() {
  const { data, loading, error, generate, exportCsv, exportExcel, exportPdf, changePage } =
    useReports();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [grouping, setGrouping] = useState<ReportGrouping>('NONE');
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [validationError, setValidationError] = useState<string | null>(null);

  const buildFilters = (): ReportFilters | null => {
    if (!from || !to) {
      setValidationError('Selecione um período para gerar o relatório');
      return null;
    }
    setValidationError(null);
    return { from, to, grouping, pageSize };
  };

  const handleGenerate = () => {
    const filters = buildFilters();
    if (filters) void generate(filters);
  };

  const handleExportCsv = () => {
    const filters = buildFilters();
    if (filters) exportCsv(filters);
  };

  const handleExportExcel = () => {
    const filters = buildFilters();
    if (filters) exportExcel(filters);
  };

  const handleExportPdf = () => {
    exportPdf();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
      </header>

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
          <p className={styles.summary}>
            {data.total} resultado{data.total !== 1 ? 's' : ''} · Página {data.page} de{' '}
            {data.totalPages}
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Grupo</th>
                  <th scope="col">Impressões</th>
                  <th scope="col">Receita</th>
                  <th scope="col">Custo</th>
                  <th scope="col">Margem Bruta</th>
                  <th scope="col">Margem Líquida</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      Nenhum resultado para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.label}</td>
                      <td>{row.printCount.toLocaleString('pt-BR')}</td>
                      <td>{formatCurrency(row.revenue)}</td>
                      <td>{formatCurrency(row.cost)}</td>
                      <td>{formatPercent(row.grossMarginPercent)}</td>
                      <td>{formatPercent(row.netMarginPercent)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginação">
              <Button
                variant="secondary"
                onClick={() => changePage(data.page - 1)}
                disabled={data.page <= 1}
                aria-label="Página anterior"
              >
                ←
              </Button>
              <span className={styles.pageInfo}>
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => changePage(data.page + 1)}
                disabled={data.page >= data.totalPages}
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
