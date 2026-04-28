import React from 'react';
import styles from './ConfirmDeleteModal.module.css';

interface ConfirmDeleteModalProps {
  customerName: string;
  activeOrderCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  customerName,
  activeOrderCount,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const isBlocked = activeOrderCount > 0;

  return (
    <>
      <div className={styles.overlay} onClick={onCancel} />
      <div
        className={styles.modal}
        data-testid="delete-customer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className={styles.header}>
          <h2 id="delete-modal-title">Confirmar Deleção</h2>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p>
            Tem certeza que quer deletar <strong>{customerName}</strong>?
          </p>
          <p className={styles.warning}>Essa ação não pode ser desfeita.</p>

          {isBlocked && (
            <div className={styles.blockedAlert}>
              <p>
                <strong>Não é possível deletar cliente com pedidos ativos.</strong>
              </p>
              <p>Este cliente possui {activeOrderCount} pedido(s) ativo(s).</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isBlocked}
            data-testid="confirm-delete"
          >
            Confirmar
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
