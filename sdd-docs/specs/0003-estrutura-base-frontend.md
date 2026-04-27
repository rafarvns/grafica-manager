# Feature: Estrutura Base do Frontend

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Estabelecer a fundação do renderer React — roteamento SPA interno (sem biblioteca de router externa pesada), layout base (Sidebar / Header / Main), bridge de comunicação IPC com o main process do Electron, camada de serviços HTTP para o backend Express, e provedores de estado global via Context API — sem a qual nenhuma tela de domínio pode ser desenvolvida com consistência.

O frontend roda dentro do Electron com `contextIsolation: true` e `nodeIntegration: false`. Toda comunicação com o sistema operacional e com o main process ocorre exclusivamente via `preload.ts` (já scaffoldado). A comunicação com o backend Express ocorre via `fetch` autenticado com o `API_TOKEN`.

---

## Requisitos Funcionais

- [ ] RF1 — Implementar um router SPA leve e próprio (sem `react-router-dom`) baseado em `History API` ou estado interno, capaz de renderizar páginas via `lazy()` + `Suspense`.
- [ ] RF2 — O layout base deve compor três zonas fixas: `Sidebar` (navegação principal), `Header` (breadcrumb + ações globais) e `Main` (área de conteúdo da página ativa).
- [ ] RF3 — A `Sidebar` deve exibir os módulos disponíveis (Dashboard, Clientes, Pedidos, Impressão) com indicação visual da rota ativa; novos módulos devem ser adicionáveis via simples declaração em uma tabela de rotas (`ROUTES`), sem alterar o componente.
- [ ] RF4 — Todas as páginas (`pages/`) devem ser carregadas via `React.lazy()` com fallback de `Suspense` para evitar bundle monolítico.
- [ ] RF5 — A camada `services/` deve expor um `apiClient` (fetch wrapper) que injeta automaticamente o header `Authorization: Bearer <token>` lido de `window.env` ou de uma variável de ambiente Vite (`import.meta.env.VITE_API_TOKEN`).
- [ ] RF6 — A camada IPC deve expor um módulo `ipcBridge.ts` em `services/` que encapsula todas as chamadas a `window.electronAPI`, com tipos derivados da interface declarada em `preload.ts`.
- [ ] RF7 — Deve existir um `AppProvider` em `contexts/` que compõe todos os contextos globais (ex.: `ThemeContext`, `NotificationContext`) e é renderizado uma única vez em `main.tsx`, envolvendo o router e o layout.
- [ ] RF8 — Deve existir um `ThemeContext` que persiste a preferência light/dark no `localStorage` e aplica a variante via atributo `data-theme` no `<html>`, alterando os CSS tokens sem rerender desnecessário.
- [ ] RF9 — Deve existir um `NotificationContext` que expõe `notify(message, type)` para exibir toasts não-bloqueantes, gerenciados internamente por fila (sem dependência de biblioteca externa).
- [ ] RF10 — Primitivos UI (`Button`, `Input`, `Select`, `Modal`, `Spinner`, `Badge`) devem ser criados em `components/ui/` com suporte completo a teclado, `aria-*` e foco visível.

---

## Requisitos Não-Funcionais

- [ ] RNF1 — (performance) O bundle inicial (chunk carregado antes de qualquer lazy page) deve ser inferior a **150 KB gzip**. Medir com `vite build --report` ou `rollup-plugin-visualizer`.
- [ ] RNF2 — (performance) Cada página lazy carregada individualmente não deve exceder **80 KB gzip** no respectivo chunk de página.
- [ ] RNF3 — (performance / memória) Em PC com 4 GB RAM e dual-core, a janela Electron deve atingir o estado interativo (TTI) em menos de **2 s** a partir do boot do processo renderer. Zero animações CSS com `@keyframes` pesadas no caminho crítico de renderização.
- [ ] RNF4 — (escalabilidade) Adicionar um novo módulo (ex.: `Estoque`) deve exigir apenas: (1) criar `pages/Estoque/` com o componente lazy, (2) inserir uma entrada na tabela `ROUTES`. Nenhuma outra alteração estrutural deve ser necessária.
- [ ] RNF5 — (type-safety) Zero `any` em toda a camada `services/`, `contexts/` e `hooks/`. `strict: true` e `noUncheckedIndexedAccess: true` habilitados no `tsconfig.json` do frontend.
- [ ] RNF6 — (acessibilidade) Todos os primitivos UI devem passar no teste automatizado de acessibilidade com `axe-core` (via Vitest). Foco visível obrigatório em todos os elementos interativos.
- [ ] RNF7 — (manutenibilidade) CSS tokens globais definidos exclusivamente em `src/index.css` via variáveis CSS (`--color-*`, `--space-*`, `--font-*`). Módulos de componente apenas referenciam tokens; nunca duplicam valores de cor ou espaçamento.
- [ ] RNF8 — (segurança) O `API_TOKEN` **nunca** deve aparecer no bundle de produção como string literal. O renderer deve recebê-lo via variável de ambiente Vite (`VITE_API_TOKEN`) ou via IPC Bridge solicitando ao main process.

---

## Critérios de Aceite

### Cenário 1: Setup do Router e Navegação Principal

- **Given** o aplicativo Electron está aberto e o renderer foi carregado com sucesso
- **When** o usuário clica em "Clientes" na Sidebar
- **Then** a URL interna (hash ou pathname) muda para `/clientes`, o chunk lazy da página `Clientes` é carregado (apenas na primeira vez), a página é renderizada na área `Main`, e o item "Clientes" na Sidebar recebe a classe `active`

### Cenário 2: Fallback de Suspense durante lazy load

- **Given** a conexão está simulando latência (throttle de rede lento no devtools)
- **When** o usuário navega para uma página lazy ainda não carregada
- **Then** um `Spinner` de carregamento é exibido na área `Main` durante o download do chunk, sem layout shift nas zonas `Sidebar` e `Header`

### Cenário 3: Implementação do Layout Base

- **Given** qualquer página está ativa no router
- **When** a janela é redimensionada para a largura mínima (800 px) ou para a largura padrão (1280 px)
- **Then** a `Sidebar` permanece visível com largura fixa (ou recolhida em ícones), o `Header` ocupa toda a largura restante, e a área `Main` não apresenta overflow horizontal nem elementos sobrepostos

### Cenário 4: Camada de Integração IPC (React ↔ Electron)

- **Given** o renderer está rodando dentro do Electron com `contextIsolation: true`
- **When** um componente chama `ipcBridge.getPlatform()` (ou qualquer método tipado do bridge)
- **Then** o valor é retornado corretamente a partir de `window.electronAPI.platform` sem acessar `ipcRenderer` diretamente, e o TypeScript não emite erros de tipo

### Cenário 5: Camada de Integração IPC — canal bidirecional

- **Given** o renderer invoca `ipcBridge.invoke('algum-canal', payload)`
- **When** o main process responde ao canal via `ipcMain.handle`
- **Then** a Promise resolve com o valor correto e o tipo de retorno está inferido estaticamente sem `any`

### Cenário 6: Camada de Serviços (API Client)

- **Given** o backend Express está rodando na porta `3333` com `API_TOKEN` configurado
- **When** um hook chama `apiClient.get('/clientes')` (método tipado do fetch wrapper)
- **Then** a requisição é enviada com o header `Authorization: Bearer <token>` correto, a resposta é deserializada para o tipo esperado, e erros HTTP (4xx/5xx) são propagados como instâncias de `ApiError` (nunca strings soltas)

### Cenário 7: Provedor de Estado Global — ThemeContext

- **Given** o aplicativo é aberto pela primeira vez (sem preferência salva no localStorage)
- **When** o usuário clica no toggle de tema
- **Then** o atributo `data-theme="dark"` é adicionado ao `<html>`, os tokens CSS de cor são alterados sem rerender do layout inteiro, e a preferência é persistida no `localStorage` para a próxima sessão

### Cenário 8: Provedor de Estado Global — NotificationContext

- **Given** qualquer componente chama `notify('Pedido salvo com sucesso!', 'success')`
- **When** a notificação é emitida
- **Then** um toast não-bloqueante aparece no canto da tela por 4 s e desaparece automaticamente, sem bloquear interações com outros elementos; notificações simultâneas formam uma fila visível (máximo 3 visíveis ao mesmo tempo)

### Cenário 9: Primitivo UI — Button

- **Given** um `<Button variant="primary" disabled>` está renderizado
- **When** o usuário tenta clicar com mouse ou pressionar `Enter`/`Space` com foco no botão
- **Then** o evento `onClick` **não** é disparado, o atributo `aria-disabled="true"` está presente, o cursor exibe `not-allowed`, e o foco visível permanece acessível via teclado

### Cenário 10: Primitivo UI — Input

- **Given** um `<Input label="Nome do cliente" error="Campo obrigatório" />` está renderizado
- **When** o componente é inspecionado com leitor de tela
- **Then** o `<input>` possui `aria-describedby` apontando para o elemento de erro, o `<label>` está associado via `htmlFor`, e a borda vermelha de erro é visível

---

## API Contract

N/A — Esta spec não expõe rotas HTTP novas. A camada `services/apiClient` **consome** a API do backend (documentada em `sdd-docs/api/`). O contrato IPC entre renderer e main process é documentado diretamente nos tipos de `preload.ts`.

---

## Dependências

- **Specs relacionadas:**
  - `0001-schema-banco-dados.md` — tipos de domínio que o frontend consome
  - `0002-estrutura-base-backend.md` — API Express que o `apiClient` acessa (especialmente a rota `GET /health` para verificação de conectividade)
- **Pacotes/serviços externos:**
  - `react` + `react-dom` — já instalados
  - `vite` + `@vitejs/plugin-react` — já instalados
  - `electron` — já instalado
  - `vitest` + `@playwright/test` — já instalados (testes)
  - Nenhuma nova dependência de runtime é necessária para esta spec
- **ADRs relevantes:** nenhum pendente; se surgir necessidade de um router externo (ex.: TanStack Router), registrar ADR antes de instalar

---

## Estrutura de Arquivos Proposta

```
packages/frontend/
├── electron/
│   ├── main.ts                         # Main process (já existente)
│   ├── preload.ts                      # IPC Bridge — expõe window.electronAPI (já existente)
│   └── ipc/                            # Handlers IPC do main process
│       └── app.handlers.ts             # ex.: handler para getPlatform, openFile, etc.
│
├── src/
│   ├── main.tsx                        # Entry point React — monta <AppProvider> + <Router>
│   ├── App.tsx                         # Componente raiz — aplica layout base
│   ├── index.css                       # Tokens CSS globais (já existente — expandir)
│   │
│   ├── router/
│   │   ├── Router.tsx                  # Componente router SPA (baseado em History API)
│   │   ├── routes.ts                   # Tabela ROUTES: { path, label, icon, component }[]
│   │   └── useRouter.ts                # Hook: { pathname, navigate(path) }
│   │
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   └── DashboardPage.tsx       # lazy() — página inicial
│   │   ├── Clientes/
│   │   │   └── ClientesPage.tsx        # lazy() — módulo Clientes
│   │   ├── Pedidos/
│   │   │   └── PedidosPage.tsx         # lazy() — módulo Pedidos
│   │   ├── Impressao/
│   │   │   └── ImpressaoPage.tsx       # lazy() — módulo Impressão
│   │   └── NotFound/
│   │       └── NotFoundPage.tsx        # Fallback de rota inexistente
│   │
│   ├── components/
│   │   ├── ui/                         # Primitivos — sem lógica de domínio
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Input.module.css
│   │   │   ├── Select/
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Select.module.css
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Modal.module.css
│   │   │   ├── Spinner/
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── Spinner.module.css
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Badge.module.css
│   │   │   └── Toast/
│   │   │       ├── Toast.tsx           # Item individual de notificação
│   │   │       ├── ToastContainer.tsx  # Fila de toasts renderizada pelo NotificationContext
│   │   │       └── Toast.module.css
│   │   │
│   │   └── domain/                     # Componentes de domínio (implementados em specs futuras)
│   │       └── .gitkeep
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx               # Orquestra Sidebar + Header + Main
│   │   ├── AppLayout.module.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.css
│   │   └── Header/
│   │       ├── Header.tsx
│   │       └── Header.module.css
│   │
│   ├── contexts/
│   │   ├── AppProvider.tsx             # Compõe todos os providers em ordem correta
│   │   ├── ThemeContext.tsx            # light/dark — persiste em localStorage
│   │   └── NotificationContext.tsx     # Fila de toasts — expõe notify()
│   │
│   ├── hooks/
│   │   ├── useTheme.ts                 # Consome ThemeContext
│   │   └── useNotification.ts          # Consome NotificationContext
│   │
│   ├── services/
│   │   ├── apiClient.ts               # Fetch wrapper — injeta Authorization, trata ApiError
│   │   └── ipcBridge.ts               # Encapsula window.electronAPI com tipos explícitos
│   │
│   ├── types/
│   │   ├── electron.d.ts              # Declaração global de window.electronAPI
│   │   └── api.ts                     # ApiError, ApiResponse<T> — tipos de serviço
│   │
│   └── utils/
│       └── cn.ts                      # Helper para compor classNames de CSS Modules
│
└── tests/
    ├── unit/
    │   ├── components/
    │   │   └── Button.spec.tsx         # Testa variantes, disabled, aria, foco
    │   ├── hooks/
    │   │   └── useTheme.spec.ts
    │   └── services/
    │       └── apiClient.spec.ts       # Testa injeção de header, tratamento de ApiError
    └── e2e/
        └── navigation.spec.ts          # Playwright — navega entre módulos, verifica Suspense
```

---

## Notas de Implementação

### Router SPA próprio (sem react-router-dom)

Implementar um router mínimo baseado em `window.history.pushState` e no evento `popstate`. O hook `useRouter` é o único ponto de acesso ao estado de navegação.

```typescript
// src/router/useRouter.ts — esboço de contrato
interface RouterState {
  pathname: string;
  navigate: (path: string) => void;
}
```

O componente `Router.tsx` lê `ROUTES` e faz o match por `pathname`, renderizando o componente correspondente dentro de um `<Suspense>`. Rotas não encontradas renderizam `NotFoundPage`.

A tabela `ROUTES` é a única fonte de verdade para módulos:

```typescript
// src/router/routes.ts — estrutura da tabela
export const ROUTES: Route[] = [
  { path: '/',          label: 'Dashboard', icon: '…', component: lazy(() => import('../pages/Dashboard/DashboardPage')) },
  { path: '/clientes',  label: 'Clientes',  icon: '…', component: lazy(() => import('../pages/Clientes/ClientesPage'))  },
  { path: '/pedidos',   label: 'Pedidos',   icon: '…', component: lazy(() => import('../pages/Pedidos/PedidosPage'))    },
  { path: '/impressao', label: 'Impressão', icon: '…', component: lazy(() => import('../pages/Impressao/ImpressaoPage')) },
];
```

> **Justificativa da decisão:** `react-router-dom` v6 + suas dependências (history, etc.) somam ~25 KB gzip. Para uma SPA com < 10 rotas e sem SSR, o router próprio é < 2 KB e elimina a superfície de atualização de dependências externas. Registrar ADR se a decisão for contestada.

---

### Layout Base (CSS Grid)

`AppLayout` usa CSS Grid com três colunas/linhas fixas. Nenhum posicionamento absoluto no container principal para evitar bugs de reflow em dual-core.

```css
/* AppLayout.module.css — estrutura de referência */
.layout {
  display: grid;
  grid-template-columns: var(--sidebar-width, 240px) 1fr;
  grid-template-rows: var(--header-height, 56px) 1fr;
  height: 100vh;
  overflow: hidden; /* scroll gerenciado por .main */
}

.sidebar { grid-row: 1 / -1; }
.header  { grid-column: 2; }
.main    { grid-column: 2; overflow-y: auto; }
```

---

### IPC Bridge

O `ipcBridge.ts` declara métodos tipados que chamam `window.electronAPI`. O tipo de `window.electronAPI` é declarado em `types/electron.d.ts` (declaração de módulo global). Toda vez que `preload.ts` expõe um novo método, a declaração em `electron.d.ts` e o wrapper em `ipcBridge.ts` devem ser atualizados na **mesma** PR.

```typescript
// src/services/ipcBridge.ts — contrato mínimo desta spec
export const ipcBridge = {
  getPlatform: (): string => window.electronAPI.platform,
  // invoke: <T>(channel: string, payload?: unknown): Promise<T>  — implementar quando o primeiro canal bidirecional for necessário
} as const;
```

---

### API Client (Fetch Wrapper)

`apiClient.ts` é uma factory que retorna métodos tipados (`get`, `post`, `put`, `delete`). Todos os erros HTTP são convertidos em instâncias de `ApiError` (definida em `types/api.ts`) para que os hooks consumidores possam fazer narrowing seguro.

```typescript
// src/types/api.ts — contrato de erro
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) { super(message); this.name = 'ApiError'; }
}
```

O `apiClient` nunca lança `Error` genérico. Network failures (sem resposta) são convertidos em `ApiError` com `status: 0` e `code: 'NETWORK_ERROR'`.

---

### Primitivos UI — Anatomia obrigatória

Todo componente em `components/ui/` deve seguir esta anatomia:

1. **Props tipadas** com interface explícita (sem `any`, sem spreading de `HTMLAttributes` irrestrito — usar `Pick<>` ou props explícitas).
2. **`forwardRef`** para permitir foco programático (obrigatório em `Input`, `Button`, `Select`).
3. **Variantes via prop** (`variant: 'primary' | 'secondary' | 'ghost'`) mapeadas para classes do CSS Module via objeto de mapeamento, nunca via interpolação de strings.
4. **`aria-*`** mínimo: `aria-disabled` em botões, `aria-label` em ícones, `aria-describedby` em inputs com erro/hint.
5. **Foco visível**: herdar de `:focus-visible` do `index.css`; não desativar `outline` globalmente.

Exemplo de mapeamento de variante sem `any`:

```typescript
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost:     styles.variantGhost,
};
```

---

### Context API — Regras de composição

- Cada contexto vive em seu próprio arquivo em `contexts/`. Nunca colocar múltiplos contextos no mesmo arquivo.
- O hook `useTheme()` lança `Error` se chamado fora do `ThemeContext.Provider` — nunca retorna `undefined`.
- `AppProvider` é o **único** lugar que compõe providers; a ordem importa (ex.: `ThemeProvider` deve estar acima do `NotificationProvider` se este usar cores de tema).
- Contextos globais não devem carregar dados remotos — apenas gerenciar estado de UI e preferências. Dados de domínio ficam em hooks de página ou contextos de módulo (implementados em specs futuras).

---

### Testes esperados

| Tipo        | Ferramenta  | Arquivo de referência                          | O que valida                                           |
| ----------- | ----------- | ---------------------------------------------- | ------------------------------------------------------ |
| Unitário    | Vitest      | `tests/unit/components/Button.spec.tsx`        | Variantes, estado disabled, aria-disabled, foco        |
| Unitário    | Vitest      | `tests/unit/components/Input.spec.tsx`         | Label, aria-describedby, estado de erro                |
| Unitário    | Vitest      | `tests/unit/services/apiClient.spec.ts`        | Header Authorization, conversão para ApiError          |
| Unitário    | Vitest      | `tests/unit/hooks/useTheme.spec.ts`            | Toggle light/dark, persistência em localStorage        |
| E2E         | Playwright  | `tests/e2e/navigation.spec.ts`                 | Navegar entre módulos, Spinner de Suspense, URL correta|
| E2E         | Playwright  | `tests/e2e/notification.spec.ts`               | Toast aparece, desaparece após 4 s, fila de 3          |

---

### Riscos

- **Electron sandbox + `history.pushState`:** No modo `sandbox: true`, alguns browsers embutidos no Electron bloqueiam `pushState` em URLs `file://`. Testar em dev (Vite URL `http://localhost:5173`) e em prod (arquivo local). Fallback: usar hash-based routing (`/#/clientes`) se `pushState` falhar em prod build.
- **Bundle size em fat lazy imports:** Se uma página futura importar uma lib pesada (ex.: editor de PDF), isso inflará apenas o chunk daquela página — o bundle inicial não é afetado. Monitorar com `rollup-plugin-visualizer` em CI.
- **Token no renderer em prod:** `VITE_API_TOKEN` embutido em `import.meta.env` aparece em texto claro no bundle JS. Avaliar mover a leitura do token para o main process e fornecê-lo ao renderer via IPC apenas em memória (sem persistir em `localStorage`). Registrar ADR se implementado.
