import React from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import styles from './PrintDivergenceModal.module.css';

export interface DivergenceField {
  label: string;
  expected: string;
  current: string;
}

interface PrintDivergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fields: DivergenceField[];
}

export function PrintDivergenceModal({ isOpen, onClose, onConfirm, fields }: PrintDivergenceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuração diverge do pedido">
      <p className={styles.description}>
        Os campos abaixo estão diferentes do configurado no produto do pedido. Deseja imprimir assim mesmo?
      </p>

      <ul className={styles.fieldList}>
        {fields.map((f) => (
          <li key={f.label} className={styles.fieldItem}>
            <span className={styles.fieldLabel}>{f.label}</span>
            <span className={styles.fieldExpected}>Esperado: {f.expected}</span>
            <span className={styles.fieldCurrent}>Atual: {f.current}</span>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className={styles.confirmButton} onClick={onConfirm}>
          Imprimir assim mesmo
        </button>
      </div>
    </Modal>
  );
}
