import React, { useState } from 'react';
import {
  usePrintJobReport,
  PrintJobReportGrouping,
  PrintJobReportPageSize,
  PrintJobReportFilters,
} from '@/hooks/usePrintJobReport';
import { ReportsTabs } from '@/components/domain/ReportsTabs';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './PrintJobReportPage.module.css';

const GROUPING_LABELS: Record<PrintJobReportGrouping, string> = {
  none: 'Sem agrupamento',
  paper: 'Por papel',
  color: 'Por cor',
  quality: 'Por qualidade',
  printer: 'Por impressora',
  status: 'Por status',
};

const COLOR_LABELS: Record<string, string> = {
  CMYK: 'CMYK',
  RGB: 'RGB',
  GRAYSCALE: 'P&B',
};

const QUALITY_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  NORMAL: 'Normal',
  HIGH: 'Alta',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Sucesso',
  error: 'Erro',
  cancelled: 'Cancelada',
};

const PAGE_SIZE_OPTIONS: PrintJobReportPageSize[] = [25, 50, 100];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR');
}

export function PrintJobReportPage() {
  const { data, loading, error, generate, exportCsv, exportExcel, changePage } =
    usePrintJobReport();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [grouping, setGrouping] = useState<PrintJobReportGrouping>('none');
  const [pageSize, setPageSize] = useState<PrintJobReportPageSize>(25);
  const [validationError, setValidationError] = useState<string | null>(null);

  const buildFilters = (): PrintJobReportFilters | null => {
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

  const totalPages = data
    ? Math.ceil(data.pagination.totalCount / data.pagination.pageSize)
    : 0;

  const isGrouped = data && grouping !== 'none';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
      </header>
      <ReportsTabs />

      <section className={styles.filters} aria-label="Filtros do relatório">
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="pjr-from" className={styles.label}>
              Data inicial <span aria-hidden="true">*</span>
            </label>
            <input
              id="pjr-from"
              type="date"
              className={styles.input}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="pjr-to" className={styles.label}>
              Data final <span aria-hidden="true">*</span>
            </label>
            <input
              id="pjr-to"
              type="date"
              className={styles.input}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="pjr-grouping" className={styles.label}>
              Agrupar por
            </label>
            <select
              id="pjr-grouping"
              className={styles.select}
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as PrintJobReportGrouping)}
            >
              {(Object.keys(GROUPING_LABELS) as PrintJobReportGrouping[]).map((g) => (
                <option key={g} value={g}>
                  {GROUPING_LABELS[g]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="pjr-page-size" className={styles.label}>
              Linhas por página
            </label>
            <select
              id="pjr-page-size"
              className={styles.select}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as PrintJobReportPageSize)}
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
        </div>
      </section>

      {loading && !data && (
        <div className={styles.loadingCenter}>
          <Spinner />
        </div>
      )}

      {data && (
        <section aria-label="Resultado do relatório">
          {/* Totais */}
          <div className={styles.totals}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Impressões</span>
              <span className={styles.totalValue}>{data.totals.totalJobs.toLocaleString('pt-BR')}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Bem-sucedidas</span>
              <span className={styles.totalValue}>{data.totals.successfulJobs.toLocaleString('pt-BR')}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Taxa de sucesso</span>
              <span className={styles.totalValue}>{formatPercent(data.totals.successRate)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Total de folhas</span>
              <span className={styles.totalValue}>{data.totals.totalPages.toLocaleString('pt-BR')}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Folhas P&B</span>
              <span className={styles.totalValue}>{data.totals.totalPagesBlackAndWhite.toLocaleString('pt-BR')}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Folhas coloridas</span>
              <span className={styles.totalValue}>{data.totals.totalPagesColor.toLocaleString('pt-BR')}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Custo total</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.totalCost)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Custo médio/job</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.averageCostPerJob)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Custo médio/folha</span>
              <span className={styles.totalValue}>{formatCurrency(data.totals.averageCostPerPage)}</span>
            </div>
          </div>

          <p className={styles.summary}>
            {data.pagination.totalCount.toLocaleString('pt-BR')} registro{data.pagination.totalCount !== 1 ? 's' : ''} ·{' '}
            Página {data.pagination.page} de {totalPages}
          </p>

          <div className={styles.tableWrapper}>
            {isGrouped ? (
              /* Tabela agrupada */
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{GROUPING_LABELS[grouping]}</th>
                    <th scope="col">Impressões</th>
                    <th scope="col">Folhas</th>
                    <th scope="col">Folhas P&B</th>
                    <th scope="col">Folhas Color</th>
                    <th scope="col">Custo Total</th>
                    <th scope="col">Custo/Job</th>
                    <th scope="col">Custo/Folha</th>
                    <th scope="col">Taxa Sucesso</th>
                    <th scope="col">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.grouped.length === 0 ? (
                    <tr>
                      <td colSpan={10} className={styles.empty}>
                        Nenhum resultado para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    data.grouped.map((row) => (
                      <tr key={row.groupKey}>
                        <td>{row.groupLabel}</td>
                        <td>{row.jobCount.toLocaleString('pt-BR')}</td>
                        <td>{row.totalPages.toLocaleString('pt-BR')}</td>
                        <td>{row.totalPagesBlackAndWhite.toLocaleString('pt-BR')}</td>
                        <td>{row.totalPagesColor.toLocaleString('pt-BR')}</td>
                        <td>{formatCurrency(row.totalCost)}</td>
                        <td>{formatCurrency(row.averageCostPerJob)}</td>
                        <td>{formatCurrency(row.averageCostPerPage)}</td>
                        <td>{formatPercent(row.successRate)}</td>
                        <td>{formatPercent(row.sharePercent)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* Tabela detalhada */
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Documento</th>
                    <th scope="col">Papel</th>
                    <th scope="col">Gram.</th>
                    <th scope="col">Cor</th>
                    <th scope="col">Qualidade</th>
                    <th scope="col">Pgs P&B</th>
                    <th scope="col">Pgs Color</th>
                    <th scope="col">Custo</th>
                    <th scope="col">Status</th>
                    <th scope="col">Impressora</th>
                    <th scope="col">Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className={styles.empty}>
                        Nenhum resultado para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row) => (
                      <tr key={row.id}>
                        <td>{formatDate(row.printedAt)}</td>
                        <td className={styles.docName}>{row.documentName}</td>
                        <td>{row.paperTypeName}</td>
                        <td>{row.paperWeight} g/m²</td>
                        <td>
                          <span className={styles[`color${row.colorProfile}`]}>
                            {COLOR_LABELS[row.colorProfile] ?? row.colorProfile}
                          </span>
                        </td>
                        <td>{QUALITY_LABELS[row.quality] ?? row.quality}</td>
                        <td>{row.pagesBlackAndWhite.toLocaleString('pt-BR')}</td>
                        <td>{row.pagesColor.toLocaleString('pt-BR')}</td>
                        <td>{formatCurrency(row.registeredCost)}</td>
                        <td>
                          <span className={styles[`status${row.status}`]}>
                            {STATUS_LABELS[row.status] ?? row.status}
                          </span>
                        </td>
                        <td>{row.printerName}</td>
                        <td>{row.orderNumber ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
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
