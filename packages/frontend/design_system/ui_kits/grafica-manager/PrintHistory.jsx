// Print History Page — Arte Papel Gráfica Manager

const PRINT_DATA = [
  { id: 'P-0881', printer: 'Epson L8050', file: 'pedido_1042_arte.pdf', pages: 500, material: 'A4 Couché 150g', profile: 'CMYK Vívido', date: '28/04/2026 14:32', cost: 'R$ 42,50', order: '#1042' },
  { id: 'P-0880', printer: 'Epson L8050', file: 'cartao_visita_ana.pdf', pages: 200, material: 'A6 Cartão 300g', profile: 'CMYK Padrão', date: '28/04/2026 11:10', cost: 'R$ 18,00', order: '#1040' },
  { id: 'P-0879', printer: 'Canon iX6820', file: 'flyer_carlos_1000.pdf', pages: 1000, material: 'A5 Offset 90g', profile: 'RGB Web', date: '27/04/2026 16:45', cost: 'R$ 85,00', order: '#1039' },
  { id: 'P-0878', printer: 'Canon iX6820', file: 'adesivos_loja.pdf', pages: 300, material: 'Etiqueta Adesiva', profile: 'CMYK Padrão', date: '27/04/2026 09:22', cost: 'R$ 27,00', order: '#1037' },
  { id: 'P-0877', printer: 'Epson L8050', file: 'folder_fernanda.pdf', pages: 400, material: 'A4 Couché 115g', profile: 'CMYK Vívido', date: '26/04/2026 15:00', cost: 'R$ 34,00', order: '#1036' },
];

function PrintHistoryPage() {
  const [search, setSearch] = React.useState('');

  const filtered = PRINT_DATA.filter(p =>
    p.file.toLowerCase().includes(search.toLowerCase()) ||
    p.printer.toLowerCase().includes(search.toLowerCase()) ||
    p.order.includes(search)
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Histórico de Impressões</h2>
        <Button variant="secondary">Exportar CSV</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          placeholder="Buscar por arquivo, impressora ou pedido..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 300 }}
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{filtered.length} registros</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Total de páginas" value="2.400" />
        <KpiCard label="Custo total" value="R$ 206,50" highlight />
        <KpiCard label="Impressoras ativas" value="2" />
        <KpiCard label="Trabalhos hoje" value="2" />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['ID', 'Arquivo', 'Impressora', 'Material', 'Perfil', 'Págs.', 'Pedido', 'Custo', 'Data/Hora'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af', fontWeight: 600 }}>{p.id}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#1a56db', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.file}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6' }}>{p.printer}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{p.material}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6' }}><Badge variant="primary">{p.profile}</Badge></td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{p.pages.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{p.order}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#0e9f6e' }}>{p.cost}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { PrintHistoryPage });
