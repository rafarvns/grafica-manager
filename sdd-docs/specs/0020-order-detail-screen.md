# Feature: Tela de Detalhe do Pedido

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a visualização completa e interativa de um pedido: dados do pedido, timeline imutável de transições de status, lista de impressões vinculadas, arquivos anexos, e botões de ação (mudar status, cancelar, adicionar arquivo, enviar para impressão).

## Requisitos Funcionais

- [ ] RF1 — Tela `/orders/:id` com visualização de pedido específico
- [ ] RF2 — Cabeçalho: número do pedido (ex: "ORD-001"), status com badge colorido, cliente (link para perfil), data de criação
- [ ] RF3 — Abas/seções: "Detalhes", "Impressões", "Arquivos", "Timeline"
- [ ] RF4 — Seção "Detalhes": descrição, quantidade, tipo de papel, dimensões, preço de venda, custo estimado, data limite
- [ ] RF5 — Seção "Impressões": lista de print jobs vinculados ao pedido com status, custo, links para mais detalhes
- [ ] RF6 — Seção "Arquivos": lista de arquivos anexos com preview (PDF, imagem), botão "Adicionar arquivo", botão remover
- [ ] RF7 — Seção "Timeline": histórico imutável de todas as transições de status (de → para, data/hora, motivo se houver)
- [ ] RF8 — Barra de ações no topo/fundo: botões contextuais baseados no status
- [ ] RF9 — Ações possíveis: "Mudar para [próximo status]", "Cancelar", "Adicionar Arquivo", "Enviar para Impressão"
- [ ] RF10 — Se status = "shipping", modo read-only (nenhuma ação, apenas visualização)
- [ ] RF11 — Se status = "cancelado", modo read-only com badge vermelho
- [ ] RF12 — Modal para mudar status com validação de transição
- [ ] RF13 — Modal para cancelar com motivo obrigatório
- [ ] RF14 — Botão "Enviar para Impressão" abre modal selecionando tipo de impressão (papel, qualidade, cores)
- [ ] RF15 — Editar descrição do pedido (se status != "shipping" e != "cancelado")
- [ ] RF16 — Voltar para listagem de pedidos (breadcrumb ou botão)

## Requisitos Não-Funcionais

- [ ] RNF1 — Dados carregados via fetch assíncrono (loading skeleton enquanto busca)
- [ ] RNF2 — Timeline é imutável (append-only, sem UPDATE/DELETE)
- [ ] RNF3 — Responsivo: abas viram drawer em <768px, seções empilhadas em mobile
- [ ] RNF4 — CSS Modules, sem styled-components
- [ ] RNF5 — Acessibilidade: abas com ARIA roles, timeline com tempo semanticamente correto

## Critérios de Aceite

### Cenário 1: Abrir detalhe de um pedido
- **Given** usuário em listagem de pedidos, clica em "ORD-001"
- **When** página carrega `/orders/ORD-001`
- **Then** cabeçalho exibe: "ORD-001" | Status "agendado" (badge azul) | Cliente "João"
- **Then** abas são renderizadas: Detalhes, Impressões, Arquivos, Timeline

### Cenário 2: Visualizar detalhes do pedido
- **Given** seção "Detalhes" visível
- **When** usuário a acessa
- **Then** exibe: descrição "Cartaz A1 CMYK", quantidade 10, papel "Couchê", dimensões "100x50cm", preço R$500, custo R$100, data limite "2026-05-10"

### Cenário 3: Visualizar impressões vinculadas
- **Given** seção "Impressões" visível
- **When** usuário a acessa
- **Then** lista com 3 impressões: print job 1 (status "sucesso", custo R$100), print job 2 (sucesso, R$100), print job 3 (erro, R$0)

### Cenário 4: Visualizar arquivos
- **Given** seção "Arquivos" visível
- **When** usuário a acessa
- **Then** lista: "design.pdf" (link, preview PDF inline), "mockup.jpg" (link, preview imagem), botão "Adicionar arquivo"
- **When** clica em "Adicionar arquivo"
- **Then** modal de upload abre, usuário seleciona arquivo, clica "Upload"
- **Then** arquivo é adicionado à lista, toast "Arquivo adicionado"

### Cenário 5: Visualizar timeline de status
- **Given** seção "Timeline" visível
- **When** usuário a acessa
- **Then** exibe histórico (mais recente primeiro):
  ```
  ↳ 2026-04-27 14:30 — Mudado de "agendado" para "em_production"
  ↳ 2026-04-27 09:00 — Criado (status inicial: "draft")
  ```

### Cenário 6: Mudar status do pedido
- **Given** pedido em status "draft"
- **When** clica em botão "Mudar para Agendado"
- **Then** modal abre com confirmação e opção de motivo (opcional)
- **Then** usuário clica "Confirmar"
- **Then** status é atualizado para "agendado", timeline ganha nova entrada, toast "Pedido movido para agendado"

### Cenário 7: Cancelar pedido
- **Given** pedido em status "agendado"
- **When** clica em "Cancelar"
- **Then** modal abre com campo obrigatório "Motivo do cancelamento"
- **Then** usuário preenche "Cliente solicitou cancelamento", clica "Confirmar"
- **Then** status muda para "cancelado", timeline atualiza, badge fica vermelha, modo read-only ativado

### Cenário 8: Enviar para impressão
- **Given** pedido em status "em_production"
- **When** clica em "Enviar para Impressão"
- **Then** modal abre com opções: tipo de papel (select), qualidade (select), cores (select)
- **Then** usuário seleciona e clica "Enviar"
- **Then** impressão é criada e vinculada ao pedido, seção "Impressões" atualiza

### Cenário 9: Read-only em shipping
- **Given** pedido em status "shipping"
- **When** página é visualizada
- **Then** nenhum botão de ação é exibido
- **Then** seção "Detalhes" não tem campos editáveis (display-only)

### Cenário 10: Editar descrição
- **Given** pedido em status "draft"
- **When** clica em ícone de editar na descrição
- **Then** campo fica editável inline (não modal), usuário altera, clica "Salvar"
- **Then** descrição é atualizada, campo volta a display-only

## API Contract

Frontend consome endpoints dos specs 0010, 0011, 0008:
- `GET /api/orders/:id` — Detalhe do pedido com todas as seções
- `PATCH /api/orders/:id` — Atualizar descrição, preço, custo
- `POST /api/orders/:id/status` — Mudar status
- `POST /api/orders/:id/cancel` — Cancelar com motivo
- `POST /api/orders/:id/attachments` — Upload de arquivo
- `DELETE /api/orders/:id/attachments/:fileId` — Remover arquivo
- `GET /api/orders/:id/history` — Histórico de mudanças de status
- `GET /api/orders/:id/print-jobs` — Impressões vinculadas
- `POST /api/orders/:id/print-jobs` — Criar impressão (enviar para impressão)

Documentar em `sdd-docs/api/orders.yaml` (conforme spec 0010).

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0019-orders-screen.md](0019-orders-screen.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0011-order-print-customer-linking.md](0011-order-print-customer-linking.md), [0008-print-recording-accounting.md](0008-print-recording-accounting.md)
- Pacotes/serviços externos: nenhum (React nativo)
- ADRs relevantes: nenhum

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/OrderDetail.tsx` — página principal (layout da tela)
  - `src/components/domain/OrderHeader.tsx` — cabeçalho com número, status badge, cliente
  - `src/components/domain/OrderTabs.tsx` — tabs/abas com as 4 seções
  - `src/components/domain/OrderDetailsSection.tsx` — seção Detalhes (leitura + edição inline)
  - `src/components/domain/OrderPrintJobsSection.tsx` — seção Impressões (listagem + link para detalhes)
  - `src/components/domain/OrderFilesSection.tsx` — seção Arquivos (listagem + upload)
  - `src/components/domain/OrderTimelineSection.tsx` — seção Timeline (histórico imutável)
  - `src/components/domain/OrderActionBar.tsx` — barra de ações (botões contextuais)
  - `src/components/domain/ChangeStatusModal.tsx` — modal para mudar status
  - `src/components/domain/CancelOrderModal.tsx` — modal para cancelar com motivo
  - `src/components/domain/PrintJobModal.tsx` — modal para enviar para impressão
  - `src/hooks/useOrderDetail.ts` — hook para fetch e atualização de estado
  - `src/hooks/useOrderActions.ts` — hook para ações (mudar status, cancelar, etc.)

- **Estado da página**:
  ```typescript
  interface OrderDetailState {
    order: Order | null;
    loading: boolean;
    error: string | null;
    activeTab: 'details' | 'printJobs' | 'files' | 'timeline';
    editingField?: string; // Campo em edição inline
    modals: {
      changeStatus?: boolean;
      cancel?: boolean;
      printJob?: boolean;
      fileUpload?: boolean;
    };
  }
  ```

- **Status colors** (badges):
  - `draft` → cinza (não iniciado)
  - `scheduled` → azul (agendado)
  - `in_production` → laranja (em andamento)
  - `completed` → verde (concluído)
  - `shipping` → verde escuro (enviado)
  - `cancelled` → vermelho (cancelado)

- **Transições de status permitidas**:
  ```
  draft → scheduled, cancelado
  scheduled → in_production, draft, cancelado
  in_production → completed, cancelado
  completed → shipping, cancelado
  shipping → (nenhuma transição, read-only)
  cancelado → (nenhuma transição, terminal)
  ```

- **Fluxo de dados**:
  1. Página `/orders/:id` monta, fetch GET de order
  2. Cabeçalho renderiza com número, status badge, cliente
  3. Abas renderizam, ativa "Detalhes" por padrão
  4. Cada seção faz seu próprio fetch (detalhes, impressões, arquivos, timeline)
  5. Clique em ação → modal abre correspondente
  6. Validação e envio → fetch POST/PATCH, estado atualiza, timeline ganha entrada
  7. Edição inline → clique editar → campo fica input → clique salvar → fetch PATCH
  8. Upload → modal abre → clique upload → fetch POST, seção atualiza
  9. Se status = shipping, barra de ações fica vazia

- **Edição inline** (descrição):
  - Clique em ícone de lápis → campo vira `<input type="text">`
  - Perde foco ou clique fora → cancela edição
  - Clique "Salvar" → fetch PATCH, volta a display-only

- **Timeline** (imutável):
  - Mostra todas as transições em ordem reverse (mais recente primeiro)
  - Formato: "Data hora — Ação (ex: 'Mudado de draft para scheduled')"
  - Motivo do cancelamento aparece na entrada correspondente

- **CSS Modules**:
  - `OrderDetail.module.css` — layout page com header + tabs + content
  - `OrderHeader.module.css` — cabeçalho com breadcrumb
  - `OrderTabs.module.css` — abas com underline active
  - `OrderDetailsSection.module.css` — cards de informação
  - `OrderPrintJobsSection.module.css` — lista de impressões
  - `OrderFilesSection.module.css` — lista de arquivos com preview
  - `OrderTimelineSection.module.css` — timeline vertical com datas
  - `OrderActionBar.module.css` — barra com botões
  - Modals com `.module.css` próprios

- **Acessibilidade**:
  - Tabs com `role="tablist"`, cada aba com `role="tab"`
  - Timeline com `<time>` element para datas
  - Botões com `aria-label` descritivos
  - Modals com `role="dialog"` e focus trap
  - Status badges com aria-label (não só cor)
  - Edição inline com claro visual que é editável

- **Testes esperados**:
  - Unit: validação de transição de status (draft → shipping é inválido)
  - Unit: cálculo de status badge color
  - Unit: formatação de timeline (order by descending)
  - Integration: fetch de order, seções carregam dados
  - Integration: mudar status atualiza no banco, timeline ganha entrada
  - Integration: upload de arquivo, arquivo aparece na seção
  - Integration: cancelamento com motivo, timeline reflete
  - E2E: abrir `/orders/ORD-001` → mudar status → ver timeline → upload arquivo → cancelar
  - E2E: verificar modo read-only em "shipping"
  - E2E: edição inline de descrição

- **Riscos**:
  - Timeline com muitos registros (10k+) → paginação ou virtualização
  - Edição inline sem salvar e sair da página → perda de dados (undo pelo browser ou validação ao sair)
  - Impressão criada mas falha → aparece no detalhe com status "erro", permitir remover/retrying
  - Arquivo removido mas ainda aparece em cache → refetch obrigatório
  - Status transition concorrência: 2 usuários mudam status simultaneamente → último vence (confirm update do banco)

- **Implementação sugerida (ordem)**:
  1. Criar page `/orders/:id` com layout básico
  2. Criar hook `useOrderDetail` para fetch de order
  3. Criar `OrderHeader` com cabeçalho
  4. Criar `OrderTabs` com 4 abas
  5. Criar seções: `OrderDetailsSection`, `OrderPrintJobsSection`, `OrderFilesSection`, `OrderTimelineSection`
  6. Integrar fetch de cada seção
  7. Criar `OrderActionBar` com botões contextuais
  8. Criar modals: `ChangeStatusModal`, `CancelOrderModal`, `PrintJobModal`
  9. Implementar edição inline de descrição
  10. Implementar upload de arquivo
  11. Testar transições de status
  12. CSS, responsividade, acessibilidade
  13. Testes E2E completos

---

**Esta spec depende de 0019 (Listagem) e implementa o frontend de 0010 (Manual Order CRUD) + 0011 (Linking).**
