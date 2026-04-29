# Gráfica Manager — Design System

> Versão: 1.0.0-draft · Data: 2026-04-29 · Status: Em elaboração (baseado na auditoria 0030)
> Alinhado com: `README.md` (Decisões Técnicas + Princípios do Frontend)

Este documento é a fonte de verdade para decisões de UI/UX do projeto. Toda task de frontend **deve** seguir este documento. A skill `/frontend-ds` o enforça automaticamente.

---

## 0. Restrição de Performance — Não-Negociável

> Extraído do README: *"Electron otimizado: renderização leve, lazy loading agressivo, sem animações desnecessárias — alvo: PCs com 4GB RAM e dual-core."*

**Toda decisão de design passa por este filtro:** vai funcionar bem num PC com 4GB RAM e CPU dual-core?

| Restrição | Regra |
|----------|-------|
| **Lazy loading** | Toda página usa `React.lazy()` + `Suspense`. Sem exceção. |
| **Listas longas** | Listas com potencial > 100 itens usam virtualização própria (sem lib). |
| **Animações** | Somente transições funcionais (feedback de interação). Zero animações decorativas. |
| **Pacotes pesados** | Verificar tamanho antes de qualquer `pnpm add`. Sem MUI, Chakra, Ant, Tailwind, emotion, styled-components. |
| **CSS-in-JS** | Proibido. Usa CSS Modules + CSS custom properties (zero runtime). |
| **Estado global** | Context API + hooks próprios. Sem Redux, Zustand, Recoil, MobX. |
| **Imagens/PDFs** | Streaming/chunking. Nunca carregue arquivo inteiro em memória. |
| **Polling** | Proibido. Prefira eventos/IPC. |

---

## 1. Princípios

1. **Tokens primeiro** — nunca use valor hardcoded se existe um token. Se não existe, crie o token antes do componente.
2. **Composição** — use os primitivos de `components/ui/`. Nunca reinvente input, button, modal, card em componentes de domínio.
3. **Acessibilidade não é opcional** — foco visível, labels semânticas, suporte a teclado em todo primitivo.
4. **Zero runtime overhead** — CSS custom properties puras, sem CSS-in-JS.
5. **Performance é design** — escolhas visuais que impactem a máquina alvo são rejeitadas, independente de quão belas sejam.

---

## 2. Tokens CSS — Fonte de Verdade

Todos os tokens vivem em `packages/frontend/src/index.css`. Nenhum token deve ser declarado em CSS Modules individuais.

### 2.1 Cores

```css
/* Primárias */
--color-primary:        #1a56db;
--color-primary-dark:   #1e429f;
--color-primary-hover:  #1648c2;
--color-primary-light:  rgba(26, 86, 219, 0.15);   /* foco / highlight */

/* Semânticas */
--color-success:        #0e9f6e;
--color-success-light:  #d1fae5;
--color-warning:        #c27803;
--color-warning-light:  #fef3c7;
--color-danger:         #e02424;
--color-danger-light:   #fee2e2;

/* Neutras */
--color-secondary:      #6b7280;
--color-bg:             #f3f4f6;
--color-surface:        #ffffff;
--color-surface-hover:  #f9fafb;
--color-border:         #e5e7eb;
--color-text:           #111827;
--color-text-muted:     #6b7280;
```

**Regra:** Nunca use hex ou rgba diretamente em CSS Modules. Use o token.

**Cores de Badge** (tokens, não hardcoded):
```css
/* Textos de badge usam as cores semânticas acima */
/* Backgrounds usam a variante -light */
/* Ex: badge success → color: --color-success; bg: --color-success-light */
```

### 2.2 Espaçamento

A escala canônica é `--space-N`. A série `--spacing-*` é **depreciada** e será removida.

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;    /* ADICIONAR — falta no index.css atual */
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;    /* ADICIONAR */
--space-12: 48px;
--space-16: 64px;
```

**Mapa de migração `--spacing-*` → `--space-*`:**
```
--spacing-xs  → --space-1  (4px)
--spacing-sm  → --space-2  (8px)
--spacing-md  → --space-3  (12px)  ← decisão: md = 12px, não 16px
--spacing-lg  → --space-4  (16px)
--spacing-xl  → --space-6  (24px)
--spacing-2xl → --space-8  (32px)
```

### 2.3 Tipografia

```css
/* Font sizes */
--font-size-xs:   0.75rem;    /* 12px — ADICIONAR */
--font-size-sm:   0.875rem;   /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-md:   1rem;       /* alias de base — ADICIONAR para compatibilidade */
--font-size-lg:   1.125rem;   /* 18px */
--font-size-xl:   1.25rem;    /* 20px */
--font-size-2xl:  1.5rem;     /* 24px */
--font-size-3xl:  1.875rem;   /* 30px */

/* Font weights */
--font-weight-normal:    400;
--font-weight-medium:    500;
--font-weight-semibold:  600;  /* ADICIONAR — elimina os 600 hardcoded */
--font-weight-bold:      700;
```

**Hierarquia tipográfica:**

| Elemento | Font-size token | Font-weight token |
|---------|-----------------|------------------|
| Page title (h1) | `--font-size-2xl` | `--font-weight-bold` |
| Section title (h2) | `--font-size-xl` | `--font-weight-semibold` |
| Card title (h3) | `--font-size-lg` | `--font-weight-semibold` |
| Body text | `--font-size-base` | `--font-weight-normal` |
| Label / caption | `--font-size-sm` | `--font-weight-medium` |
| Micro / badge | `--font-size-xs` | `--font-weight-medium` |

### 2.4 Border Radius

```css
--radius-xs: 2px;    /* ADICIONAR — chips, tags muito pequenas */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;   /* ADICIONAR — modais grandes */
--radius-full: 9999px;  /* pílulas */
```

**Não use:** 3px, 6px, 10px — use o token mais próximo.

### 2.5 Sombras

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Mapa de uso:**
- Card normal: `--shadow-sm`
- Card hover / dropdown: `--shadow-md`
- Modal pequeno: `--shadow-lg`
- Modal grande / overlay: `--shadow-xl`

### 2.6 Z-Index (Escala de Camadas)

```css
--z-base:      0;
--z-raised:    10;
--z-dropdown:  100;
--z-sticky:    200;
--z-modal:     1000;
--z-toast:     9999;
```

**Nunca** use valores hardcoded de z-index. Sempre use o token.

### 2.7 Transições

```css
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;
```

**Regra de animação (README):** use transições apenas para feedback funcional (hover, focus, open/close). Nunca para decoração. Duração máxima recomendada: `--transition-base` (250ms). Evite `animation` contínua exceto em spinners de loading.

---

## 3. Arquitetura Frontend — Regras Estruturais

> Extraído do README, seção "Frontend — Arquitetura Leve" e "Decisões Técnicas".

### 3.1 Estrutura de Pastas (canônica)

```
src/
├── pages/          # Telas — todas lazy-loaded via React.lazy()
├── components/
│   ├── ui/         # Primitivos: Button, Input, Modal, Table, Select...
│   └── domain/     # Componentes de domínio: PrintPreview, OrderCard...
├── hooks/          # Custom hooks — lógica reutilizável
├── contexts/       # Context API — estado global leve
├── services/       # Fetch wrapper para a API (único lugar com fetch)
├── types/          # Tipos TypeScript do renderer
└── utils/          # Funções puras sem side-effects
```

### 3.2 Lazy Loading — Obrigatório em Toda Página

```tsx
// App.tsx — toda página é lazy
const OrdersPage   = lazy(() => import('@/pages/OrdersPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));

export function App() {
  return (
    <Suspense fallback={<div className={styles.pageLoader}><Spinner size="lg" /></div>}>
      {/* roteamento */}
    </Suspense>
  );
}
```

**Nunca** importe uma página diretamente (import estático). Sempre via `React.lazy()`.

### 3.3 Estado Global — Context API + Hooks

> README: *"Context API ao invés de Redux/Zustand — menos overhead para a máquina alvo."*

```tsx
// ✅ Correto — Context API leve
const { notifications, notify } = useNotification();
const { /* dados globais */ } = useAppContext();

// ❌ Proibido
import { useSelector } from 'react-redux';
import { useStore } from 'zustand';
```

**Regras:**
- Estado de UI local → `useState` no próprio componente
- Estado compartilhado entre poucos componentes → props ou composição
- Estado verdadeiramente global (auth, tema, notificações) → Context API
- Nunca instale Redux, Zustand, Recoil, Jotai, MobX

### 3.4 Camada de Serviços — Único Ponto de Fetch

```tsx
// ✅ Correto — fetch só em services/
// services/customerService.ts
export async function listCustomers(filters: CustomerFilters): Promise<Customer[]> {
  return apiClient.get('/api/v1/customers', filters);
}

// ✅ Correto — página consome via hook
// hooks/useCustomers.ts
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  // ...
}

// ❌ Proibido — fetch direto na página/componente
export function CustomersPage() {
  const data = await fetch('/api/v1/customers'); // NUNCA
}
```

### 3.5 Virtualização de Listas Longas

> README: *"Virtualização de listas longas (implementação própria)"*

Para qualquer lista com potencial de ultrapassar 100 itens:

```tsx
// ✅ Use virtualização própria (sem react-window, react-virtual, etc.)
// Padrão: renderizar apenas itens visíveis + buffer

// ❌ Proibido para listas longas
items.map(item => <OrderCard key={item.id} order={item} />)
// Se items.length > 100, virtualizar.
```

O utilitário de virtualização fica em `src/utils/virtualList.ts` (implementação própria).

---

## 4. Componentes Primitivos (UI)

Todos em `packages/frontend/src/components/ui/`. **Nunca** instale biblioteca de UI externa.

### 4.1 Button

```tsx
import { Button } from '@/components/ui/Button/Button';

// Variantes disponíveis
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Opcional</Button>
<Button variant="danger">Excluir</Button>
<Button variant="success">Confirmar</Button>

// Com ícone
<Button variant="primary" leftIcon={<Plus size={16} />}>Novo</Button>

// Loading
<Button variant="primary" isLoading>Salvando...</Button>

// Tamanhos (se existirem)
<Button size="sm">Pequeno</Button>
<Button size="md">Normal</Button>  {/* padrão */}
<Button size="lg">Grande</Button>
```

**Regras:**
- Sempre use `<Button>` — nunca `<button>` raw em páginas ou domínio
- Ações destrutivas usam `variant="danger"` com dialog de confirmação
- Ações primárias da tela (ex: "Salvar") usam `variant="primary"`
- Ações secundárias (ex: "Cancelar") usam `variant="secondary"` ou `variant="ghost"`

### 4.2 Input

```tsx
import { Input } from '@/components/ui/Input/Input';

<Input
  label="Nome"
  value={form.name}
  onChange={(e) => updateField('name', e.target.value)}
  error={errors.name}
  placeholder="Digite o nome"
/>
```

**Regras:**
- Sempre passe `label` (accessibilidade)
- Passe `error` para estado de erro — não crie estilos de erro customizados
- Nunca use `<input>` raw

### 4.3 Select

```tsx
import { Select } from '@/components/ui/Select/Select';

<Select
  label="Status"
  value={form.status}
  onChange={(e) => updateField('status', e.target.value)}
  options={[{ value: 'active', label: 'Ativo' }]}
/>
```

### 4.4 Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card/Card';

<Card>
  <CardHeader>
    <h2>Título da Seção</h2>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

**Regras:**
- Containers de seção usam `<Card>` — não crie divs com box-shadow manual
- Box-shadow do Card usa `--shadow-sm` por padrão

### 4.5 Modal

```tsx
import { Modal } from '@/components/ui/Modal/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar Exclusão"
  size="sm"  /* sm | md | lg */
>
  <p>Tem certeza?</p>
  <div className={styles.actions}>
    <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
    <Button variant="danger" onClick={handleConfirm}>Excluir</Button>
  </div>
</Modal>
```

**Regras:**
- Sempre use `<Modal>` — nunca crie overlay/backdrop manual
- Z-index do modal usa `--z-modal`
- Backdrop: `rgba(0, 0, 0, 0.5)` com `backdrop-filter: blur(2px)`
- Tamanho: `sm=400px`, `md=500px` (padrão), `lg=800px`

### 4.6 Badge

```tsx
import { Badge } from '@/components/ui/Badge/Badge';

<Badge variant="success">Entregue</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Cancelado</Badge>
<Badge variant="primary">Novo</Badge>
```

**Regras:**
- Cores usam tokens semânticos — nunca cores hardcoded
- `bg: var(--color-{variant}-light)` + `color: var(--color-{variant})`

### 4.7 Toast / Notificação

```tsx
import { useNotification } from '@/contexts/NotificationContext';

const { notify } = useNotification();

notify('Pedido salvo com sucesso!', 'success');
notify('Erro ao salvar', 'error');
notify('Atenção: estoque baixo', 'warning');
```

**Regras:**
- Sempre use `useNotification` — nunca renderize toast manual
- Toast usa `--z-toast` (9999)

### 4.8 Spinner

```tsx
import { Spinner } from '@/components/ui/Spinner/Spinner';

<Spinner size="sm" />  /* 16px */
<Spinner size="md" />  /* 24px — padrão */
<Spinner size="lg" />  /* 40px */
```

### 4.9 Table

```tsx
import { Table, TableHeader, TableRow, TableCell } from '@/components/ui/Table/Table';

<Table>
  <thead>
    <TableRow isHeader>
      <TableCell isHeader>Nome</TableCell>
    </TableRow>
  </thead>
  <tbody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
      </TableRow>
    ))}
  </tbody>
</Table>
```

---

## 5. Padrões de Layout

### 5.1 Estrutura de Página

```tsx
// pages/XxxPage.tsx
export function XxxPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Título da Página</h1>
        <Button variant="primary" leftIcon={<Plus />}>Ação Principal</Button>
      </div>

      {/* Filtros em Card */}
      <Card>
        <CardContent>
          <div className={styles.filters}>
            {/* filtros */}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      <Card>
        <CardContent>
          {loading && <Spinner />}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {!loading && !error && <Table>...</Table>}
        </CardContent>
      </Card>
    </div>
  );
}
```

```css
/* XxxPage.module.css — padrão */
.page        { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.pageHeader  { display: flex; align-items: center; justify-content: space-between; }
.title       { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text); }
.filters     { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.error       { color: var(--color-danger); font-size: var(--font-size-sm); }
```

### 4.2 Formulários

```tsx
// Dentro de Modal ou seção
<form className={styles.form} onSubmit={handleSubmit}>
  <div className={styles.field}>
    <Input label="Nome" value={form.name} onChange={...} error={errors.name} />
  </div>
  <div className={styles.field}>
    <Select label="Status" value={form.status} onChange={...} options={...} />
  </div>
  <div className={styles.actions}>
    <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
    <Button variant="primary" type="submit" isLoading={saving}>Salvar</Button>
  </div>
</form>
```

```css
.form    { display: flex; flex-direction: column; gap: var(--space-4); }
.field   { display: flex; flex-direction: column; gap: var(--space-2); }
.actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
```

---

## 6. Estados Interativos — Padrões

### Loading

```tsx
// Loading de página inteira
if (loading) return <div className={styles.loading}><Spinner size="lg" /></div>;

// Loading inline (lista parcial)
{loading && <Spinner size="md" />}

// Loading de botão — use isLoading prop
<Button isLoading={saving}>Salvando...</Button>
```

```css
.loading { display: flex; justify-content: center; align-items: center; padding: var(--space-12); }
```

### Erro

```tsx
// Erro de página
{error && (
  <div className={styles.errorBox} role="alert">
    <p>{error}</p>
    <Button variant="secondary" onClick={retry}>Tentar novamente</Button>
  </div>
)}
```

```css
.errorBox {
  padding: var(--space-4);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-danger);
}
```

### Estado Vazio

```tsx
{!loading && items.length === 0 && (
  <div className={styles.emptyState}>
    <p>Nenhum item encontrado.</p>
  </div>
)}
```

---

## 7. Acessibilidade — Regras Obrigatórias

- Todo `<button>` deve ter texto visível ou `aria-label`
- Todo `<input>` e `<select>` devem ter `<label>` associado
- Erros de formulário devem ter `role="alert"` ou `aria-describedby`
- Modais devem ter `role="dialog"` e `aria-labelledby`
- Ícones decorativos: `aria-hidden="true"`
- Foco visível: nunca use `outline: none` sem substituto

---

## 8. Anti-Padrões — O Que NÃO Fazer

| ❌ Errado | ✅ Correto |
|----------|-----------|
| `padding: 16px` | `padding: var(--space-4)` |
| `font-size: 14px` | `font-size: var(--font-size-sm)` |
| `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| `color: #e02424` | `color: var(--color-danger)` |
| `box-shadow: 0 4px 16px rgba(0,0,0,0.15)` | `box-shadow: var(--shadow-lg)` |
| `border-radius: 8px` | `border-radius: var(--radius-md)` |
| `z-index: 1000` | `z-index: var(--z-modal)` |
| `<button onClick={...}>` | `<Button onClick={...}>` |
| `<input style={{...}}>` | `<Input label="..." />` |
| Criar backdrop manual | Usar `<Modal>` |
| `--spacing-md` | `--space-3` |
| Inline style em JSX | CSS Module com token |
| `import { useSelector } from 'react-redux'` | `useContext` / hook próprio |
| `import { motion } from 'framer-motion'` | `transition: var(--transition-fast)` em CSS |
| `import MUI / Chakra / Ant / Tailwind` | Componentes de `components/ui/` |
| Import estático de página | `React.lazy(() => import(...))` |
| `items.map(...)` para lista >100 itens | Virtualização própria em `utils/virtualList` |
| `setInterval / polling` | Evento IPC ou evento de domínio |

---

## 9. Checklist de Review

Antes de fazer merge de qualquer mudança frontend:

**Tokens e estilos:**
- [ ] Nenhum valor hardcoded de cor, tamanho, espaçamento ou sombra
- [ ] Todos os tokens usados estão definidos em `index.css`
- [ ] Nenhuma lib de UI externa foi adicionada (MUI, Chakra, Ant, Tailwind, emotion, styled-components)
- [ ] Nenhum CSS-in-JS (`style={{ }}` inline exceto para valores dinâmicos impossíveis via CSS)

**Primitivos e composição:**
- [ ] Componentes de domínio usam `<Button>`, `<Input>`, `<Card>`, `<Modal>` dos primitivos
- [ ] Nenhum `<button>` ou `<input>` raw em páginas ou domain components

**Performance (alvo 4GB RAM / dual-core):**
- [ ] Página nova usa `React.lazy()` + `Suspense`
- [ ] Listas com >100 itens potenciais usam virtualização própria
- [ ] Nenhuma animação decorativa adicionada — apenas transições funcionais
- [ ] Nenhuma dependência pesada nova adicionada sem verificar tamanho
- [ ] Estado global via Context API — sem Redux, Zustand ou similares

**Qualidade:**
- [ ] Estados de loading, erro e vazio estão tratados
- [ ] Labels e aria-* estão presentes
- [ ] Foco visível não foi removido

---

## 10. Tokens a Adicionar em index.css (Pendentes)

> Esta seção lista os gaps da auditoria 0030. Serão adicionados na spec 0031.

```css
/* Espaçamento — faltando */
--space-5:  20px;
--space-10: 40px;

/* Tipografia — faltando */
--font-size-xs:      0.75rem;
--font-size-md:      1rem;          /* alias de base */
--font-weight-semibold: 600;

/* Cores — faltando */
--color-primary-light:  rgba(26, 86, 219, 0.15);
--color-success-light:  #d1fae5;
--color-warning-light:  #fef3c7;
--color-danger-light:   #fee2e2;
--color-error:          #e02424;    /* alias de danger */
--color-error-light:    #fee2e2;

/* Border radius — faltando */
--radius-xs:   2px;
--radius-xl:   16px;
--radius-full: 9999px;

/* Sombras — faltando */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Z-index — faltando */
--z-base:     0;
--z-raised:   10;
--z-dropdown: 100;
--z-sticky:   200;
--z-modal:    1000;
--z-toast:    9999;
```
