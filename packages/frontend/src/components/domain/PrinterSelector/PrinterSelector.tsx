import React, { useEffect, useState, useMemo } from 'react';
import { Select } from '@/components/ui/Select/Select';
import { Printer, PrinterStatus } from '@/types/printer';
import { printerService } from '@/services/printerService';
import styles from './PrinterSelector.module.css';

export interface PrinterSelectorProps {
  onSelect?: (printer: Printer | null) => void;
  onDetailsClick?: (printer: Printer) => void;
  className?: string;
}

const WarningIcon = () => (
  <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const PrinterSelector: React.FC<PrinterSelectorProps> = ({ onSelect, onDetailsClick, className }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    printerService.getPrinters().then(data => {
      if (!mounted) return;
      setPrinters(data);
      setLoading(false);
      const defaultPrinter = data.find(p => p.isDefault);
      if (defaultPrinter) {
        setSelectedName(defaultPrinter.name);
        onSelect?.(defaultPrinter);
      } else if (data.length > 0) {
        setSelectedName(data[0].name);
        onSelect?.(data[0]);
      }
    });
    return () => { mounted = false; };
  }, [onSelect]);

  const selectedPrinter = useMemo(() => printers.find(p => p.name === selectedName), [printers, selectedName]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedName(name);
    const printer = printers.find(p => p.name === name);
    onSelect?.(printer || null);
  };

  const getStatusText = (status: number) => {
    // Basic bitmask check or direct match based on how Windows spooler reports it
    if (status & PrinterStatus.PAPER_JAM) return 'Atolamento de papel';
    if (status & PrinterStatus.PAPER_OUT) return 'Sem papel';
    if (status & PrinterStatus.OFFLINE) return 'Offline';
    if (status & PrinterStatus.ERROR) return 'Erro genérico';
    if (status & PrinterStatus.DOOR_OPEN) return 'Porta aberta';
    if (status & PrinterStatus.TONER_LOW) return 'Toner/Tinta baixa';
    if (status & PrinterStatus.NO_TONER) return 'Sem toner/tinta';
    return 'Status de alerta (' + status + ')';
  };

  const hasWarning = selectedPrinter && 
    selectedPrinter.status !== PrinterStatus.READY && 
    selectedPrinter.status !== PrinterStatus.PRINTING &&
    selectedPrinter.status !== PrinterStatus.PROCESSING;

  if (loading) {
    return <div className={className}>Carregando impressoras...</div>;
  }

  const options = printers.map(p => ({
    value: p.name,
    label: p.displayName || p.name
  }));

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Select
        label="Selecionar Impressora"
        options={options}
        value={selectedName}
        onChange={handleChange}
        disabled={printers.length === 0}
      />
      {hasWarning && selectedPrinter && (
        <div className={styles.alertBox}>
          <WarningIcon />
          <div className={styles.alertContent}>
            <strong>Atenção:</strong>
            <span>A impressora apresenta o alerta: {getStatusText(selectedPrinter.status)}.</span>
            {onDetailsClick && (
              <button 
                type="button" 
                className={styles.detailsBtn}
                onClick={() => onDetailsClick(selectedPrinter)}
              >
                Ver interface detalhada da impressora
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
