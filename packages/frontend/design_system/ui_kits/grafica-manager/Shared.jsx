// Shared UI components — Arte Papel Gráfica Manager UI Kit

const css = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (vals[i] ?? ''), '');

// ── Button ──────────────────────────────────────────
function Button({ children, variant = 'primary', onClick, disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '6px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    borderRadius: 8, border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms', opacity: disabled ? 0.55 : 1, whiteSpace: 'nowrap',
  };
  const variants = {
    primary:   { background: '#1a56db', color: '#fff', borderColor: '#1a56db' },
    secondary: { background: '#fff', color: '#111827', borderColor: '#e5e7eb' },
    ghost:     { background: 'transparent', color: '#6b7280', borderColor: 'transparent' },
    danger:    { background: '#e02424', color: '#fff', borderColor: '#e02424' },
    success:   { background: '#0e9f6e', color: '#fff', borderColor: '#0e9f6e' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ── Badge ──────────────────────────────────────────
function Badge({ children, variant = 'default' }) {
  const variants = {
    default: { background: '#e5e7eb', color: '#6b7280' },
    primary: { background: 'rgba(26,86,219,0.12)', color: '#1e429f' },
    success: { background: '#d1fae5', color: '#0e9f6e' },
    warning: { background: '#fef3c7', color: '#c27803' },
    danger:  { background: '#fee2e2', color: '#e02424' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 4, fontSize: 11, fontWeight: 500, lineHeight: 1.5,
      ...variants[variant],
    }}>{children}</span>
  );
}

// ── KpiCard ─────────────────────────────────────────
function KpiCard({ label, value, subtitle, highlight }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      boxShadow: '0 1px 3px rgb(0 0 0/0.07)', padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? '#1a56db' : '#111827', lineHeight: 1.2 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

// ── Card ────────────────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 3px rgb(0 0 0/0.07)', overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{title}</div>
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

// ── Input ───────────────────────────────────────────
function Input({ label, placeholder, value, onChange, type = 'text', error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          padding: '7px 11px', border: `1px solid ${error ? '#e02424' : '#e5e7eb'}`,
          borderRadius: 8, fontFamily: 'inherit', fontSize: 13, color: '#111827',
          background: '#fff', outline: 'none', width: '100%',
        }}
      />
      {error && <div style={{ fontSize: 12, color: '#e02424' }}>{error}</div>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────
function Select({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: '7px 11px', border: '1px solid #e5e7eb', borderRadius: 8,
          fontFamily: 'inherit', fontSize: 13, color: '#111827', background: '#fff',
          outline: 'none', width: '100%',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────
const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: '▪' },
  { path: 'pedidos', label: 'Pedidos', icon: '▪' },
  { path: 'clientes', label: 'Clientes', icon: '▪' },
  { path: 'impressoes', label: 'Impressões', icon: '▪' },
  { path: 'relatorios', label: 'Relatórios', icon: '▪' },
  { path: 'shopee', label: 'Shopee', icon: '▪' },
  { path: 'configuracoes', label: 'Configurações', icon: '▪' },
];

function Sidebar({ current, onNavigate }) {
  return (
    <aside style={{
      width: 'var(--sidebar-width)', background: 'var(--color-sidebar-bg)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          arte<span style={{ color: '#d97b8a' }}>papel</span>
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Gráfica Manager</div>
      </div>
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = current === item.path;
          return (
            <div
              key={item.path}
              onClick={() => onNavigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 20px', cursor: 'pointer',
                color: active ? '#fff' : '#c9d1e0',
                background: active ? '#1a56db' : 'transparent',
                borderLeft: `3px solid ${active ? '#fff' : 'transparent'}`,
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                transition: 'all 150ms',
              }}
            >
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Header ──────────────────────────────────────────
function Header({ title }) {
  return (
    <header style={{
      height: 'var(--header-height)', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      borderBottom: '1px solid var(--color-border)', background: '#fff', flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: '#1a56db',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>GR</div>
      </div>
    </header>
  );
}

// ── Toast ───────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  const colors = { success: '#0e9f6e', danger: '#e02424', warning: '#c27803' };
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: '#fff',
      border: `1px solid ${colors[type]}`, borderLeft: `4px solid ${colors[type]}`,
      borderRadius: 8, padding: '12px 16px', boxShadow: '0 4px 12px rgb(0 0 0/0.15)',
      fontSize: 13, color: '#111827', zIndex: 9999, maxWidth: 320,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginLeft: 'auto' }}>✕</button>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────
function Modal({ title, children, onClose, footer }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 480, maxWidth: '90vw',
        boxShadow: '0 20px 40px rgb(0 0 0/0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>✕</button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#f9fafb', borderRadius: '0 0 12px 12px' }}>{footer}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { Button, Badge, KpiCard, Card, Input, Select, Sidebar, Header, Toast, Modal, NAV_ITEMS });
