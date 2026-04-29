// Dashboard Page — Arte Papel Gráfica Manager

function DashboardPage() {
  const [period, setPeriod] = React.useState('lastSevenDays');

  const periods = [
    { key: 'today', label: 'Hoje' },
    { key: 'lastSevenDays', label: 'Últimos 7 dias' },
    { key: 'thisWeek', label: 'Esta semana' },
    { key: 'thisMonth', label: 'Este mês' },
  ];

  const topCustomers = [
    { name: 'Maria Souza', orders: 14, revenue: 'R$ 3.280,00' },
    { name: 'João Lima', orders: 9, revenue: 'R$ 2.140,00' },
    { name: 'Ana Costa', orders: 7, revenue: 'R$ 1.870,00' },
    { name: 'Carlos Mendes', orders: 5, revenue: 'R$ 960,00' },
    { name: 'Loja Printex', orders: 4, revenue: 'R$ 820,00' },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1300, overflowY: 'auto', flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {periods.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                background: period === p.key ? '#fff' : 'transparent',
                border: 'none', padding: '4px 11px', borderRadius: 6, fontSize: 12,
                color: period === p.key ? '#1a56db' : '#6b7280',
                fontWeight: period === p.key ? 600 : 400,
                boxShadow: period === p.key ? '0 1px 3px rgb(0 0 0/0.1)' : 'none',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              }}>{p.label}</button>
            ))}
          </div>
          <Button variant="primary">Atualizar</Button>
          <Button variant="secondary">Exportar PDF</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <KpiCard label="Impressões no período" value="1.432" />
        <KpiCard label="Pedidos em aberto" value="37" />
        <KpiCard label="Faturamento" value="R$ 12.480" highlight />
        <KpiCard label="Custo de impressão" value="R$ 4.210" />
        <KpiCard label="Margem bruta" value="66.2%" subtitle="R$ 8.270 de lucro bruto" />
        <KpiCard label="Pedidos novos" value="58" subtitle="Shopee: 34 · Manual: 24" />
        <KpiCard label="Maior cliente" value="Maria Souza" subtitle="R$ 3.280,00" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Tendência de impressões">
          {/* Mini sparkline placeholder */}
          <svg width="100%" height="100" viewBox="0 0 300 80" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,60 C30,50 60,30 90,35 C120,40 150,20 180,25 C210,30 240,10 270,15 L270,80 L0,80 Z" fill="url(#grad)" />
            <path d="M0,60 C30,50 60,30 90,35 C120,40 150,20 180,25 C210,30 240,10 270,15" fill="none" stroke="#3b82f6" strokeWidth="2" />
            {[0,90,180,270].map((x, i) => {
              const ys = [60,35,25,15];
              return <circle key={i} cx={x} cy={ys[i]} r="4" fill="#3b82f6" />;
            })}
          </svg>
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
              <span key={d} style={{ fontSize: 10, color: '#9ca3af', flex: 1, textAlign: 'center' }}>{d}</span>
            ))}
          </div>
        </Card>
        <Card title="Pedidos por origem">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="35" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="110 110" strokeDashoffset="0" />
              <circle cx="45" cy="45" r="35" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="70 150" strokeDashoffset="-110" />
              <circle cx="45" cy="45" r="35" fill="none" stroke="#22c55e" strokeWidth="16" strokeDasharray="40 180" strokeDashoffset="-180" />
              <circle cx="45" cy="45" r="26" fill="#fff" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Shopee','#f97316','50%'],['Mercado Livre','#3b82f6','32%'],['Manual','#22c55e','18%']].map(([label,color,pct]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ color: '#374151' }}>{label}</span>
                  <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card title="Top 5 clientes por faturamento">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['#','Cliente','Pedidos','Faturamento'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.name} style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{c.orders}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#1a56db' }}>{c.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { DashboardPage });
