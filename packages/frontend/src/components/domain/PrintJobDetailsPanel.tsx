import type { PrintJobDetailDTO } from '@/hooks/usePrintHistory';
import styles from './PrintJobDetailsPanel.module.css';

interface PrintJobDetailsPanelProps {
  job: PrintJobDetailDTO;
  onClose: () => void;
  onReprocess?: (id: string) => void;
  onViewDocument?: (job: PrintJobDetailDTO) => void;
}

const STATUS_LABELS: Record<string, string> = {
  sucesso: 'Sucesso',
  erro: 'Erro',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
};

export function PrintJobDetailsPanel({ job, onClose, onReprocess, onViewDocument }: PrintJobDetailsPanelProps) {
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.panel}
        data-testid="print-job-details"
      >
        <div className={styles.header}>
          <h2>Detalhes da Impressão</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar painel"
            data-testid="close-details-button"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Informações Gerais</h3>
            <div className={styles.field}>
              <label>ID:</label>
              <span>{job.id}</span>
            </div>
            <div className={styles.field}>
              <label>Documento:</label>
              <span data-testid="detail-document-name">{job.documentName}</span>
            </div>
            <div className={styles.field}>
              <label>ID do Pedido:</label>
              <span>{job.orderId || '-'}</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Configuração de Impressão</h3>
            <div className={styles.field}>
              <label>Tipo de Papel:</label>
              <span>{job.paperTypeId}</span>
            </div>
            <div className={styles.field}>
              <label>Qualidade:</label>
              <span className={styles.capitalize}>{job.quality}</span>
            </div>
            <div className={styles.field}>
              <label>Modo de Cor:</label>
              <span>{job.colorMode}</span>
            </div>
            <div className={styles.field}>
              <label>DPI:</label>
              <span>{job.dpi}</span>
            </div>
            <div className={styles.field}>
              <label>Páginas:</label>
              <span>{job.pageCount}</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Resultado e Custo</h3>
            <div className={styles.field}>
              <label>Status:</label>
              <span
                className={`${styles.status} ${styles[job.status]}`}
                data-testid="detail-status"
              >
                {STATUS_LABELS[job.status]}
              </span>
            </div>
            {job.errorMessage && (
              <div className={styles.field}>
                <label>Mensagem de Erro:</label>
                <span className={styles.error}>{job.errorMessage}</span>
              </div>
            )}
            <div className={styles.field}>
              <label>Custo Registrado:</label>
              <span
                className={styles.cost}
                data-testid="detail-cost"
              >
                R$ {job.registeredCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Data e Hora</h3>
            <div className={styles.field}>
              <label>Registrado em:</label>
              <span>{formatDate(job.createdAt)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className={styles.section}>
            <h3>Ações</h3>
            <div className={styles.actions}>
              {job.status === 'erro' && onReprocess && (
                <button
                  className={styles.reprocessButton}
                  onClick={() => onReprocess(job.id)}
                  data-testid="reprocess-button"
                  aria-label="Reprocessar impressão"
                >
                  Reprocessar
                </button>
              )}
              {job.status === 'sucesso' && onViewDocument && (
                <button
                  className={styles.viewDocumentButton}
                  onClick={() => onViewDocument(job)}
                  data-testid="view-document-button"
                  aria-label="Ver documento PDF"
                >
                  Ver Documento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
