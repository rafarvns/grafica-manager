import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelOrderModal({ isOpen, onClose, onConfirm }: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar Pedido">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
        </p>
        <Input 
          id="cancel-reason"
          label="Motivo do Cancelamento"
          value={reason} 
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Erro no arquivo / Cliente desistiu"
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onClose}>Voltar</Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm} 
            isLoading={loading}
            disabled={!reason.trim()}
          >
            Confirmar Cancelamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
