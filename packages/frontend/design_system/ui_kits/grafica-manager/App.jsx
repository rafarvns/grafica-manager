// App.jsx — Main entry point for Gráfica Manager UI Kit

function OrderDetailView({ order, onBack }) {
  const [activeTab, setActiveTab] = React.useState('details');
  const [toast, setToast] = React.useState(null);
  const s = STATUS_MAP[order.status];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Voltar
        </button>
        <span style={{ color: '#e5e7eb' }}>|</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pedido #{order.id}</h2>
        <Badge variant={s.variant}>{s.label}</Badge>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button variant="secondary">Alterar Status</Button>
          <Button variant="primary">Imprimir Agora</Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb' }}>
        {[['details','Detalhes'],['files','Arquivos'],['print','Impressões']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500,
            color: activeTab === key ? '#1a56db' : '#6b7280',
            borderBottom: `2px solid ${activeTab === key ? '#1a56db' : 'transparent'}`,
            marginBottom: -2, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Informações do Pedido">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Cliente', order.customer], ['Origem', order.origin], ['Itens', order.items], ['Data', order.date], ['Valor', order.value]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Configuração de Material">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Papel', 'Couché 150g'], ['Formato', 'A4'], ['Perfil de cor', 'CMYK Vívido'], ['Qualidade', 'Alta'], ['Gramatura', '150g/m²']].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'files' && (
        <Card title="Arquivos do Pedido">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['arte_final_v2.pdf', 'preview_rascunho.pdf'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ width: 36, height: 36, background: '#fee2e2', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#e02424' }}>PDF</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{f}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>2.4 MB · Enviado em 28/04/2026</div>
                </div>
                <Button variant="ghost" style={{ marginLeft: 'auto', fontSize: 12 }}>Visualizar</Button>
              </div>
            ))}
            <button style={{ padding: '10px', border: '2px dashed #e5e7eb', borderRadius: 8, background: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
              + Enviar arquivo
            </button>
          </div>
        </Card>
      )}

      {activeTab === 'print' && (
        <Card title="Trabalhos de Impressão">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0e9f6e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>P-0881 — arte_final_v2.pdf</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Epson L8050 · 500 pág. · CMYK Vívido · 28/04 14:32</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0e9f6e' }}>R$ 42,50</span>
            </div>
            <Button variant="primary" style={{ alignSelf: 'flex-start' }}>Enviar para impressora</Button>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function App() {
  const [page, setPage] = React.useState('dashboard');
  const [selectedOrder, setSelectedOrder] = React.useState(null);

  const PAGE_TITLES = {
    dashboard: 'Dashboard',
    pedidos: 'Pedidos',
    clientes: 'Clientes',
    impressoes: 'Impressões',
    relatorios: 'Relatórios',
    shopee: 'Shopee',
    configuracoes: 'Configurações',
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const renderPage = () => {
    if (page === 'pedidos' && selectedOrder) {
      return <OrderDetailView order={selectedOrder} onBack={handleBack} />;
    }
    switch (page) {
      case 'dashboard':   return <DashboardPage />;
      case 'pedidos':     return <OrdersPage onViewOrder={handleViewOrder} />;
      case 'impressoes':  return <PrintHistoryPage />;
      case 'clientes':    return <PlaceholderPage title="Clientes" desc="Gerenciamento de clientes: perfis, histórico de pedidos e faturamento por cliente." />;
      case 'relatorios':  return <PlaceholderPage title="Relatórios" desc="Relatórios de produção, custos, margens e análise de desempenho." />;
      case 'shopee':      return <PlaceholderPage title="Integração Shopee" desc="Recebimento automático de pedidos via webhook da Shopee." />;
      case 'configuracoes': return <PlaceholderPage title="Configurações" desc="Impressoras, materiais, perfis de cor, contas e preferências do sistema." />;
      default:            return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title={selectedOrder ? `Pedido #${selectedOrder.id}` : PAGE_TITLES[page]} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar current={page} onNavigate={(p) => { setPage(p); setSelectedOrder(null); }} />
        <main style={{ flex: 1, overflowY: 'auto', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, desc }) {
  return (
    <div style={{ padding: 24, flex: 1 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>{title}</h2>
      <div style={{ padding: 48, background: '#fff', border: '2px dashed #e5e7eb', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Tela em construção neste kit</div>
        <div style={{ fontSize: 13, color: '#6b7280', maxWidth: 360, margin: '0 auto' }}>{desc}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
