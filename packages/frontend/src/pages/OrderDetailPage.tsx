import React, { useState } from 'react';
import { useRouter } from '@/router/HashRouter';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { OrderHeader } from '@/components/domain/OrderHeader';
import { OrderTabs, TabType } from '@/components/domain/OrderTabs';
import { OrderDetailsSection } from '@/components/domain/OrderDetailsSection';
import { OrderTimelineSection } from '@/components/domain/OrderTimelineSection';
import { OrderPrintJobsSection } from '@/components/domain/OrderPrintJobsSection';
import { OrderFilesSection } from '@/components/domain/OrderFilesSection';
import { ChangeStatusModal } from '@/components/domain/ChangeStatusModal';
import { CancelOrderModal } from '@/components/domain/CancelOrderModal';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useToast } from '@/hooks/useToast';
import styles from './OrderDetailPage.module.css';

export function OrderDetailPage() {
  const { currentPath } = useRouter();
  const orderId = currentPath.split('/').pop() || '';
  const { addToast } = useToast();
  
  const { 
    order, 
    loading, 
    error, 
    updateDescription, 
    changeStatus, 
    cancelOrder,
    uploadFile,
    downloadFile,
    removeFile
  } = useOrderDetail(orderId);

  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleUpdateDescription = async (desc: string) => {
    try {
      await updateDescription(desc);
      addToast({ type: 'success', message: 'Descrição atualizada!' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao atualizar descrição.' });
    }
  };

  const handleChangeStatus = async (status: any, reason?: string) => {
    try {
      await changeStatus(status);
      addToast({ type: 'success', message: 'Status atualizado!' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao atualizar status.' });
    }
  };

  const handleCancelOrder = async (reason: string) => {
    try {
      await cancelOrder(reason);
      addToast({ type: 'success', message: 'Pedido cancelado.' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao cancelar pedido.' });
    }
  };

  const handleUploadFile = async (file: File) => {
    try {
      await uploadFile(file);
      addToast({ type: 'success', message: 'Arquivo enviado!' });
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao enviar arquivo.' });
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" label="Carregando detalhes do pedido..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.error}>
        <div className={styles.errorCard}>
          <h2>Erro ao carregar pedido</h2>
          <p>{error || 'Pedido não encontrado'}</p>
          <button onClick={() => window.history.back()}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <OrderHeader 
        order={order} 
        onChangeStatus={() => setShowStatusModal(true)}
        onCancel={() => setShowCancelModal(true)}
      />
      
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className={styles.content}>
        {activeTab === 'details' && (
          <OrderDetailsSection order={order} onUpdateDescription={handleUpdateDescription} />
        )}
        
        {activeTab === 'printJobs' && (
          <OrderPrintJobsSection order={order} onCreatePrintJob={async () => {}} />
        )}
        
        {activeTab === 'files' && (
          <OrderFilesSection 
            order={order} 
            onUpload={handleUploadFile} 
            onDownload={downloadFile} 
          />
        )}
        
        {activeTab === 'timeline' && (
          <OrderTimelineSection order={order} />
        )}
      </main>

      <ChangeStatusModal 
        isOpen={showStatusModal} 
        onClose={() => setShowStatusModal(false)}
        currentStatus={order.status}
        onConfirm={handleChangeStatus}
      />

      <CancelOrderModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
