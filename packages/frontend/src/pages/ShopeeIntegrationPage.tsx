import React, { useState, useEffect } from 'react';
import { useShopeeStatus } from '@/hooks/useShopeeStatus';
import { useWebhookHistory } from '@/hooks/useWebhookHistory';
import { useShopeeSync } from '@/hooks/useShopeeSync';
import { shopeeService } from '@/services/shopeeService';
import { ShopeeStatusPanel } from '@/components/domain/shopee/ShopeeStatusPanel';
import { WebhookTable } from '@/components/domain/shopee/WebhookTable';
import { WebhookDetail } from '@/components/domain/shopee/WebhookDetail';
import { ConfigureTokenModal } from '@/components/domain/shopee/ConfigureTokenModal';
import { SyncProgressModal } from '@/components/domain/shopee/SyncProgressModal';
import { ErrorLogSection } from '@/components/domain/shopee/ErrorLogSection';
import { SyncHistoryTable } from '@/components/domain/shopee/SyncHistoryTable';
import { WebhookEvent, ErrorLogEntry, SyncHistoryEntry } from '@/types/shopee';
import styles from './ShopeeIntegrationPage.module.css';

const ShopeeIntegrationPage: React.FC = () => {
  const { status, refresh: refreshStatus } = useShopeeStatus(5000);
  const { 
    webhooks, 
    loading: webhooksLoading, 
    refresh: refreshWebhooks,
    setFilters 
  } = useWebhookHistory();
  const { 
    isSyncing, 
    progress, 
    processed, 
    total, 
    status: syncStatus, 
    startSync 
  } = useShopeeSync();

  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);

  useEffect(() => {
    shopeeService.getErrorLogs().then(setErrorLogs);
    shopeeService.getSyncHistory().then(setSyncHistory);
  }, []);

  const handleSaveToken = async (token: string) => {
    try {
      await shopeeService.updateToken(token);
      setIsTokenModalOpen(false);
      refreshStatus();
    } catch (err) {
      alert('Erro ao atualizar token');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await shopeeService.reprocessWebhook(id);
      refreshWebhooks();
      setSelectedWebhook(null);
    } catch (err) {
      alert('Erro ao reprocessar webhook');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Integração Shopee</h1>
        <p>Monitore e gerencie a sincronização de pedidos com a Shopee.</p>
      </header>

      <ShopeeStatusPanel 
        status={status} 
        onConfigureToken={() => setIsTokenModalOpen(true)}
        onSyncNow={startSync}
      />

      <div className={styles.mainGrid}>
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2>Histórico de Webhooks</h2>
            <div className={styles.filters}>
              <select onChange={(e) => setFilters({ status: e.target.value as any })}>
                <option value="">Todos os Status</option>
                <option value="processed">Processados</option>
                <option value="error">Erros</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>
          <WebhookTable 
            webhooks={webhooks} 
            loading={webhooksLoading}
            onSelectWebhook={setSelectedWebhook}
            onReprocess={handleReprocess}
          />
        </section>

        <aside className={styles.sidebar}>
          <ErrorLogSection errors={errorLogs} loading={false} />
          <div style={{ marginTop: '24px' }}>
            <h4>Sincronizações Manuais</h4>
            <SyncHistoryTable history={syncHistory} loading={false} />
          </div>
        </aside>
      </div>

      <WebhookDetail 
        webhook={selectedWebhook} 
        isOpen={!!selectedWebhook} 
        onClose={() => setSelectedWebhook(null)}
        onReprocess={handleReprocess}
      />

      <ConfigureTokenModal 
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSave={handleSaveToken}
      />

      <SyncProgressModal 
        isOpen={isSyncing || syncStatus === 'completed'}
        progress={progress}
        processed={processed}
        total={total}
        status={syncStatus}
        onClose={() => window.location.reload()} // Simplificado para refresh ao fechar após sucesso
      />
    </div>
  );
};

export default ShopeeIntegrationPage;
