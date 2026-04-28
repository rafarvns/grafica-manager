import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Select } from '@/components/ui/Select/Select';
import { Input } from '@/components/ui/Input/Input';
import type { OrderStatus } from '@grafica/shared';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: OrderStatus;
  onConfirm: (status: OrderStatus, reason?: string) => Promise<void>;
}

const statuses: { value: OrderStatus; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_production', label: 'Em Produção' },
  { value: 'completed', label: 'Concluído' },
  { value: 'shipping', label: 'Enviado' },
];

export function ChangeStatusModal({ isOpen, onClose, currentStatus, onConfirm }: ChangeStatusModalProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(status, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mudar Status do Pedido">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Select 
          id="status-select"
          label="Novo Status"
          value={status} 
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          options={statuses}
        />
        <Input 
          id="status-reason"
          label="Motivo (opcional)"
          value={reason} 
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Cliente aprovou a arte"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} isLoading={loading}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  );
}
