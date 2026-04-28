# Feature: Layout Principal e Navegação

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar o shell da aplicação (layout principal, sidebar, header, roteamento) que serve como container para todas as outras telas. Esta é a fundação do frontend — sem ela, as demais telas (0018–0024) não têm lugar onde viver.

## Requisitos Funcionais

- [ ] RF1 — Estrutura de layout com 3 zonas: header (topo), sidebar (esquerda), main content area (direita/centro)
- [ ] RF2 — Header com: logo da gráfica, título da página atual, status de conexão (Redis/MySQL), botão de sair (placeholder para futura autenticação)
- [ ] RF3 — Sidebar com menu de navegação vertical com ícones + textos, expandível/colapsível
- [ ] RF4 — Menu itens: Dashboard, Clientes, Pedidos, Impressões, Configurações, Integração Shopee, Relatórios
- [ ] RF5 — Roteamento entre páginas via React Router — trocar `main content area` ao navegar
- [ ] RF6 — Breadcrumb navegacional (ex: "Home / Pedidos / Detalhes") atualizado automaticamente
- [ ] RF7 — Indicador de carregamento global (spinner/progress bar) quando requisição HTTP está em progresso
- [ ] RF8 — Error Boundary — capturar erros não tratados e exibir fallback UI (não travar a app)
- [ ] RF9 — Notificações/Toast global (para mensagens de sucesso, erro, aviso) — integrada no layout
- [ ] RF10 — Responsividade: em tela pequena, sidebar collapsa automaticamente ou fica em drawer modal

## Requisitos Não-Funcionais

- [ ] RNF1 — CSS Modules — sem styled-components, sem Tailwind, sem MUI
- [ ] RNF2 — Acessibilidade: links focáveis com teclado, labels semânticos, contraste de cor OK
- [ ] RNF3 — Performance: layout não deve bloquear renderização (lazy load das rotas)
- [ ] RNF4 — Tema de cores consistente com resto do projeto (tokens CSS)
- [ ] RNF5 — Sem animações supérfluas (conforme CLAUDE.md seção 2)

## Critérios de Aceite

### Cenário 1: Abrir aplicação
- **Given** aplicação Electron é iniciada
- **When** componente App monta
- **Then** layout principal é renderizado: header visível, sidebar com menu, main area vazia aguardando rota

### Cenário 2: Navegar para Clientes
- **Given** layout com sidebar visível
- **When** usuário clica em menu item "Clientes"
- **Then** React Router navega para `/customers`, breadcrumb muda para "Home / Clientes", main area renderiza página de clientes

### Cenário 3: Indicador de carregamento
- **Given** requisição HTTP iniciada (ex: fetch de clientes)
- **When** requisição está em andamento
- **Then** spinner/progress bar aparece no header (pequeno, sem bloquear UI)

### Cenário 4: Erro não tratado em componente
- **Given** página renderiza com bug que causa erro
- **When** componente lança exceção
- **Then** Error Boundary captura, mostra fallback UI: "Algo deu errado. Recarregue a página." com botão de reload

### Cenário 5: Toast de notificação
- **Given** usuário salva um cliente com sucesso
- **When** aplicação exibe toast de sucesso (via contexto global)
- **Then** toast aparece no canto inferior direito, desaparece após 3 segundos (ou clique em fechar)

### Cenário 6: Responsividade
- **Given** tela com 480px de largura (mobile)
- **When** layout renderiza
- **Then** sidebar collapsa para ícones-only, ou drawer fica oculto (modal ao clicar menu icon)

### Cenário 7: Breadcrumb dinâmico
- **Given** usuário em `/orders/ORD-001`
- **When** página de detalhe do pedido carrega
- **Then** breadcrumb exibe: "Home / Pedidos / ORD-001"

## API Contract

N/A — Feature é puramente frontend (shell, routing, layout).

## Dependências

- Specs relacionadas: 0018–0024 (todas as telas dependem deste layout)
- Pacotes/serviços externos:
  - `react-router-dom` v6+ (roteamento)
  - `react` hooks nativo (state management simples)
- ADRs relevantes: nenhum necessário

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/App.tsx` — wrapper principal com Layout + Router
  - `src/components/ui/Layout.tsx` — layout com header + sidebar + main area
  - `src/components/ui/Sidebar.tsx` — menu de navegação
  - `src/components/ui/Header.tsx` — topo com logo, título, status
  - `src/components/ui/Breadcrumb.tsx` — navegação atual
  - `src/components/ui/ErrorBoundary.tsx` — captura de erros
  - `src/components/ui/LoadingIndicator.tsx` — spinner global
  - `src/contexts/NotificationContext.tsx` — contexto para toasts

- **Roteamento**:
  ```
  /                 → Dashboard (0015)
  /customers        → Clientes (0018)
  /orders           → Pedidos (0019)
  /orders/:id       → Detalhe Pedido (0020)
  /print-history    → Histórico Impressões (0021)
  /settings         → Configurações (0022)
  /shopee           → Integração Shopee (0023)
  /reports          → Relatórios (0024)
  ```

- **Estado global necessário**:
  - Loading state (para spinner global)
  - Notification state (para toasts)
  - Breadcrumb state (calculado da rota atual)
  - User/app state (futura autenticação)

- **CSS Modules**:
  - `Layout.module.css` — grid de 2 colunas (sidebar + main)
  - `Sidebar.module.css` — menu items com hover/active
  - `Header.module.css` — topo com flexbox
  - `Breadcrumb.module.css` — breadcrumb trail

- **Tokens de design (variáveis CSS)**:
  - `--color-primary: #007bff` (botões, links)
  - `--color-sidebar-bg: #f8f9fa` (background sidebar)
  - `--color-border: #dee2e6` (separadores)
  - `--spacing-sm: 8px, --spacing-md: 16px` (padding/margin)
  - `--font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI'`

- **Acessibilidade**:
  - Sidebar nav com `<nav role="navigation">`
  - Menu items com `<a>` ou `<button>` focáveis
  - Breadcrumb com `<nav aria-label="Breadcrumb">`
  - Error Boundary com label descritiva
  - Toast com `role="alert"` para screen readers

- **Testes esperados**:
  - Unit: Breadcrumb calcula caminho correto da rota
  - Unit: ErrorBoundary captura erros e exibe fallback
  - Unit: NotificationContext dispara e desaparece toasts
  - E2E: Clicar menu "Clientes" → navega para `/customers` → breadcrumb atualiza
  - E2E: Erro em componente → Error Boundary aparece → clique "Reload" reinicia

- **Riscos**:
  - Layout muito acoplado às rotas — usar composition (Context + Router) para desacoplar
  - Performance de todas as telas depende deste shell — otimizar rerenderização desnecessária
  - Responsividade: drawer modal em mobile pode obscurecer main area (testar com tamanhos reais)
  - Acessibilidade: menu keyboard navigation deve estar smooth (testar com Tab/Arrow keys)

---

## Implementação Sugerida (Ordem)

1. Criar estrutura base: `<Layout>` com grid CSS (header + sidebar + main)
2. Criar `<Sidebar>` com menu items hard-coded (não dinâmico ainda)
3. Configurar React Router com as 7 rotas acima
4. Criar `<Breadcrumb>` que lê rota atual e exibe caminho
5. Adicionar `<LoadingIndicator>` que fica vazio por padrão
6. Adicionar `<ErrorBoundary>` wrapper
7. Criar `NotificationContext` para toasts
8. Implementar responsividade (sidebar collapse em mobile)
9. Testes E2E para fluxo completo de navegação
10. CSS Modules e tokens finais de design

---

**Esta spec é PRÉ-REQUISITO para todas as specs 0018–0024 (telas).**
