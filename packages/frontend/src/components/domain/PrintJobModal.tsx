import React from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { PrintConfigurationForm } from './PrintConfigurationForm';
import { useToast } from '@/hooks/useToast';
import { orderService } from '@/services/OrderService';
import { ipcBridge } from '@/services/ipcBridge';

interface PrintJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  fileId?: string | undefined;
  filename?: string | undefined;
  onSuccess?: (() => void) | undefined;
}

export function PrintJobModal({ 
  isOpen, 
  onClose, 
  orderId, 
  fileId, 
  filename,
  onSuccess 
}: PrintJobModalProps) {
  const { addToast } = useToast();

  const handleApplyConfig = async (config: any) => {
    try {
      addToast({ type: 'info', message: 'Registrando trabalho de impressão...' });
      
      // 1. Registrar no Banco de Dados
      await orderService.createPrintJob(orderId, {
        printerId: config.printerId || 'default', // TODO: Pegar da config
        quality: config.quality,
        colorProfile: config.colorMode,
        paperTypeId: config.paperTypeId,
        pagesBlackAndWhite: 0, // TODO: Calcular
        pagesColor: 0,
      });

      // 2. Disparar Impressão Real se for Electron
      if (fileId && window.electronAPI) {
        addToast({ type: 'info', message: 'Enviando para a impressora...' });
        // Aqui precisaríamos do caminho real do arquivo
        // Por enquanto, apenas registramos o job no banco
      }

      addToast({ type: 'success', message: 'Impressão solicitada com sucesso!' });
      onSuccess?.();
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao processar impressão.' });
      console.error(err);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Nova Impressão - ${filename || 'Documento'}`}
    >
      <PrintConfigurationForm onApply={handleApplyConfig} />
    </Modal>
  );
}
