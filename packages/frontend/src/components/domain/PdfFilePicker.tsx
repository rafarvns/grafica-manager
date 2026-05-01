import React from 'react';
import styles from './PdfFilePicker.module.css';

interface PdfFilePickerProps {
  filePath: string | null;
  onSelect: (path: string) => void;
  disabled?: boolean;
}

export function PdfFilePicker({ filePath, onSelect, disabled }: PdfFilePickerProps) {
  const handleClick = async () => {
    const path = await window.electronAPI?.openPdfDialog();
    if (path) onSelect(path);
  };

  const fileName = filePath ? filePath.split(/[\\/]/).pop() : null;

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.pickButton}
        onClick={handleClick}
        disabled={disabled}
      >
        Selecionar PDF
      </button>
      {fileName ? (
        <span className={styles.fileName} title={filePath ?? ''}>
          {fileName}
        </span>
      ) : (
        <span className={styles.placeholder}>Nenhum arquivo selecionado</span>
      )}
    </div>
  );
}
