import React, { useRef } from 'react';
import styles from './OrderFileUpload.module.css';
import { OrderAttachment } from '@grafica/shared';

interface OrderFileUploadProps {
  attachments: OrderAttachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function OrderFileUpload({ attachments, onUpload, onDelete, loading, disabled }: OrderFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Arquivos Anexos</label>
      
      <div className={styles.list}>
        {attachments.map((att) => (
          <div key={att.id} className={styles.item}>
            <span className={styles.fileName}>{att.name}</span>
            <button 
              type="button" 
              onClick={() => onDelete(att.id)} 
              className={styles.removeButton}
              disabled={disabled || loading}
            >
              Remover
            </button>
          </div>
        ))}
        {attachments.length === 0 && <div className={styles.empty}>Nenhum arquivo anexado.</div>}
      </div>

      {!disabled && (
        <div className={styles.uploadArea}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
            id="file-upload"
            disabled={loading}
          />
          <label htmlFor="file-upload" className={styles.uploadButton}>
            {loading ? 'Enviando...' : 'Adicionar Arquivo'}
          </label>
        </div>
      )}
    </div>
  );
}
