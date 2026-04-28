import React, { useState } from 'react';
import styles from './ConfigureTokenModal.module.css';

interface ConfigureTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
}

export const ConfigureTokenModal: React.FC<ConfigureTokenModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (token.trim()) {
      onSave(token);
      setToken('');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Configurar Token Shopee</h3>
        <p>Insira o token de integração fornecido pela Shopee para habilitar a sincronização automática.</p>
        
        <input 
          type="password"
          className={styles.input}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Insira o novo token..."
          autoFocus
        />

        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.cancel}`} onClick={onClose}>
            Cancelar
          </button>
          <button className={`${styles.button} ${styles.save}`} onClick={handleSave}>
            Salvar Token
          </button>
        </div>
      </div>
    </div>
  );
};
