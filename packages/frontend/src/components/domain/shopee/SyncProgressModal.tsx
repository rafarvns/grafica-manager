import React from 'react';
import styles from './SyncProgressModal.module.css';

interface SyncProgressModalProps {
  isOpen: boolean;
  progress: number;
  processed: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  onClose: () => void;
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  isOpen,
  progress,
  processed,
  total,
  status,
  onClose,
}) => {
  if (!isOpen) return null;

  const isFinished = status === 'completed' || status === 'failed';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{isFinished ? 'Sincronização Concluída!' : 'Sincronizando Pedidos...'}</h3>
        
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <p className={styles.statusText}>
          {status === 'completed' 
            ? `✓ ${processed} pedidos processados com sucesso.`
            : status === 'failed'
            ? `✗ A sincronização falhou após processar ${processed} pedidos.`
            : `Processando ${processed} de ${total} pedidos...`}
        </p>

        {isFinished && (
          <button className={styles.closeButton} onClick={onClose}>
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};
