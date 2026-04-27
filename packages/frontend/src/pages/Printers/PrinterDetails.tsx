import React from 'react';
import { Printer, PrinterStatus } from '@/types/printer';
import styles from './PrinterDetails.module.css';

export interface PrinterDetailsProps {
  printer: Printer;
  onClose?: () => void;
}

export const PrinterDetails: React.FC<PrinterDetailsProps> = ({ printer, onClose }) => {
  const getStatusList = (status: number) => {
    if (status === 0) return ['Pronto (0)'];
    
    const activeStatuses: string[] = [];
    const check = (mask: number, name: string) => {
      if (status & mask) activeStatuses.push(`${name} (${mask})`);
    };

    check(PrinterStatus.PAUSED, 'Pausada');
    check(PrinterStatus.ERROR, 'Erro Genérico');
    check(PrinterStatus.PENDING_DELETION, 'Deleção Pendente');
    check(PrinterStatus.PAPER_JAM, 'Atolamento de Papel');
    check(PrinterStatus.PAPER_OUT, 'Sem Papel');
    check(PrinterStatus.MANUAL_FEED, 'Alimentação Manual Necessária');
    check(PrinterStatus.PAPER_PROBLEM, 'Problema com Papel');
    check(PrinterStatus.OFFLINE, 'Offline');
    check(PrinterStatus.IO_ACTIVE, 'IO Ativo');
    check(PrinterStatus.BUSY, 'Ocupada');
    check(PrinterStatus.PRINTING, 'Imprimindo');
    check(PrinterStatus.OUTPUT_BIN_FULL, 'Bandeja de Saída Cheia');
    check(PrinterStatus.NOT_AVAILABLE, 'Não Disponível');
    check(PrinterStatus.WAITING, 'Aguardando');
    check(PrinterStatus.PROCESSING, 'Processando');
    check(PrinterStatus.INITIALIZING, 'Inicializando');
    check(PrinterStatus.WARMING_UP, 'Aquecendo');
    check(PrinterStatus.TONER_LOW, 'Nível de Toner Baixo');
    check(PrinterStatus.NO_TONER, 'Sem Toner');
    check(PrinterStatus.PAGE_PUNT, 'Página Descartada (Punt)');
    check(PrinterStatus.USER_INTERVENTION, 'Requer Intervenção do Usuário');
    check(PrinterStatus.OUT_OF_MEMORY, 'Sem Memória');
    check(PrinterStatus.DOOR_OPEN, 'Porta Aberta');
    check(PrinterStatus.SERVER_UNKNOWN, 'Status do Servidor Desconhecido');
    check(PrinterStatus.POWER_SAVE, 'Economia de Energia');

    if (activeStatuses.length === 0) {
      activeStatuses.push(`Código Desconhecido (${status})`);
    }

    return activeStatuses;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Detalhes da Impressora</h2>
        {onClose && (
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Fechar">
            &times;
          </button>
        )}
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Informações Básicas</h3>
          <dl className={styles.datalist}>
            <dt>Nome:</dt>
            <dd>{printer.name}</dd>
            
            <dt>Nome de Exibição:</dt>
            <dd>{printer.displayName}</dd>
            
            <dt>Descrição:</dt>
            <dd>{printer.description || 'N/A'}</dd>
            
            <dt>Padrão do Sistema:</dt>
            <dd>{printer.isDefault ? 'Sim' : 'Não'}</dd>
          </dl>
        </section>

        <section className={styles.section}>
          <h3>Status Avançado (Spooler)</h3>
          <ul className={styles.statusList}>
            {getStatusList(printer.status).map((s, idx) => (
              <li key={idx}><code>{s}</code></li>
            ))}
          </ul>
        </section>

        {Object.keys(printer.options || {}).length > 0 && (
          <section className={styles.section}>
            <h3>Opções e Metadados</h3>
            <pre className={styles.jsonBlock}>
              {JSON.stringify(printer.options, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
};
