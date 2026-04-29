// Orders Page — Arte Papel Gráfica Manager

const ORDERS_DATA = [
  { id: '1042', customer: 'Maria Souza', origin: 'Shopee', status: 'production', value: 'R$ 240,00', date: '28/04/2026', items: '500 un. A4 CMYK' },
  { id: '1041', customer: 'João Lima', origin: 'Manual', status: 'done', value: 'R$ 180,00', date: '27/04/2026', items: '200 un. A5 Couché' },
  { id: '1040', customer: 'Ana Costa', origin: 'Mercado Livre', status: 'waiting', value: 'R$ 95,00', date: '27/04/2026', items: '100 un. Cartão Visita' },
  { id: '1039', customer: 'Carlos Mendes', origin: 'Shopee', status: 'done', value: 'R$ 320,00', date: '26/04/2026', items: '1000 un. Flyer A6' },
  { id: '1038', customer: 'Loja Printex', origin: 'Manual', status: 'cancelled', value: 'R$ 60,00', date: '25/04/2026', items: '50 un. A3 Foto' },
  { id: '1037', customer: 'Roberto Silva', origin: 'Shopee', status: 'waiting', value: 'R$ 140,00', date: '25/04/2026', items: '300 un. Etiqueta' },
  { id: '1036', customer: 'Fernanda Torres', origin: 'Mercado Livre', status: 'production', value: 'R$ 210,00', date: '24/04/2026', items: '400 un. A4 Offset' },
];

const STATUS_MAP = {
  production: { label: 'Em Produção', variant: 'primary' },
  done:       { label: 'Concluído',   variant: 'success' },
  waiting:    { label: 'Aguardando',  variant: 'warning' },
  cancelled:  { label: 'Cancelado',   variant: 'danger' },
};

function OrdersPage({ onViewOrder }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showModal, setShowModal] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const filtered = ORDERS_DATA.filter(o => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNewOrder = () => setShowModal(true);
  const handleSaveOrder = () => {
    setShowModal(false);
    setToast({ message: 'Pedido criado com sucesso!', type: 'success' });
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pedidos</h2>
        <Button variant="primary" onClick={handleNewOrder}>+ Novo Pedido</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por cliente ou nº..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }}
        />
        <Select
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'waiting', label: 'Aguardando' },
            { value: 'production', label: 'Em Produção' },
            { value: 'done', label: 'Concluído' },
            { value: 'cancelled', label: 'Cancelado' },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{filtered.length} pedidos</div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Cliente', 'Itens', 'Origem', 'Status', 'Valor', 'Data'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const s = STATUS_MAP[o.status];
                return (
                  <tr key={o.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => onViewOrder && onViewOrder(o)}
                  >
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af', fontWeight: 600 }}>#{o.id}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{o.customer}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{o.items}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                      <Badge variant={o.origin === 'Shopee' ? 'warning' : o.origin === 'Manual' ? 'default' : 'primary'}>{o.origin}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{o.value}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{o.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Nenhum pedido encontrado.</div>
          )}
        </div>
      </Card>

      {/* New Order Modal */}
      {showModal && (
        <Modal
          title="Novo Pedido"
          onClose={() => setShowModal(false)}
          footer={<>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveOrder}>Salvar Pedido</Button>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Cliente" placeholder="Nome do cliente" />
            <Select label="Origem" options={[
              { value: 'manual', label: 'Manual' },
              { value: 'shopee', label: 'Shopee' },
              { value: 'ml', label: 'Mercado Livre' },
            ]} />
            <Input label="Descrição dos itens" placeholder="Ex: 500 un. A4 CMYK" />
            <Input label="Valor total" placeholder="R$ 0,00" />
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

Object.assign(window, { OrdersPage, ORDERS_DATA, STATUS_MAP });
