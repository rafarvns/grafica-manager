import React, { useRef, useState } from 'react';
import styles from './OrderFilesSection.module.css';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import type { Order } from '@grafica/shared';

interface OrderFilesSectionProps {
  order: Order;
  onUpload: (file: File) => Promise<void>;
  onDownload: (fileId: string, filename: string) => Promise<void>;
  onPrint: (fileId: string, filename: string) => void;
}

export function OrderFilesSection({ order, onUpload, onDownload, onPrint }: OrderFilesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.container}>
      <Card 
        title="Arquivos e Anexos" 
        footer={
          <div className={styles.uploadRow}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className={styles.hiddenInput}
              data-testid="file-upload-input"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              isLoading={uploading}
              variant="primary"
            >
              + Anexar Arquivo
            </Button>
            <span className={styles.hint}>PDF, PNG, JPG até 10MB</span>
          </div>
        }
      >
        {order.attachments && order.attachments.length > 0 ? (
          <div className={styles.fileList}>
            {order.attachments.map((file) => (
              <div key={file.id} className={styles.fileItem}>
                <div className={styles.fileIcon}>📄</div>
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{file.originalFilename}</span>
                  <span className={styles.fileSize}>{formatSize(file.size)}</span>
                </div>
                <div className={styles.fileActions}>
                  <button 
                    onClick={() => onPrint(file.id, file.originalFilename)} 
                    className={styles.printButton}
                  >
                    Imprimir
                  </button>
                  <button 
                    onClick={() => onDownload(file.id, file.originalFilename)} 
                    className={styles.actionButton}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Nenhum arquivo anexado.</p>
        )}
      </Card>
    </div>
  );
}
