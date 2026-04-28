# Feature: Tela de Histórico de Impressões

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a visualização completa e filtrada do histórico de impressões (print jobs): listagem paginada com busca avançada (período, status, cliente, pedido de origem), visualização de custos registrados, link direto para o pedido associado, e detalhe expandido de cada impressão com parâmetros técnicos e auditoria.

## Requisitos Funcionais

- [ ] RF1 — Tela `/print-history` com listagem paginada de impressões (padrão: 25 por página)
- [ ] RF2 — Filtros avançados: período (data início/fim), status (select: sucesso/erro/pendente), cliente (dropdown), pedido de origem (busca), origem (Shopee/manual)
- [ ] RF3 — Tabela principal com colunas: ID da impressão (link para detalhe), data/hora, cliente (link para perfil), pedido (link para detalhe), status (badge colorido), custo registrado (R$), papel/dimensões (resumo)
- [ ] RF4 — Busca em tempo real por ID da impressão ou número do pedido
- [ ] RF5 — Sorting por qualquer coluna (data, custo, status)
- [ ] RF6 — Modal/drawer de detalhe expandido com: ID, data, status, cliente, pedido, parâmetros técnicos (papel, qualidade, cores), custo registrado, motivo se erro
- [ ] RF7 — Se status = "erro": botão "Reprocessar" (abre modal de confirmação, ressubmete para fila)
- [ ] RF8 — Se status = "sucesso": botão "Ver Documento" (abre PDF preview de spec 0006)
- [ ] RF9 — Resumo superior: total de impressões no período, custo total, taxa de sucesso (%)
- [ ] RF10 — Export de dados: botão para exportar tabela filtrada em CSV ou PDF
- [ ] RF11 — Tooltip ao passar mouse em "custo registrado" mostrando breakdown (papel + margens + descontos se houver)
- [ ] RF12 — Paginação com botões anterior/próxima e select de página

## Requisitos Não-Funcionais

- [ ] RNF1 — Dados carregados via fetch assíncrono (loading skeleton enquanto busca)
- [ ] RNF2 — Filtros têm debounce 300ms (não refaz fetch a cada keystroke)
- [ ] RNF3 — Responsivo: tabela vira cards empilhados em <768px
- [ ] RNF4 — CSS Modules, sem styled-components
- [ ] RNF5 — Acessibilidade: tabela com headers semânticos, modais com role="dialog", sorting indicators com aria-label

## Critérios de Aceite

### Cenário 1: Abrir tela de histórico de impressões
- **Given** usuário está no layout principal
- **When** clica em "Impressões" ou navega para `/print-history`
- **Then** tela carrega com listagem de impressões dos últimos 30 dias, filtros visíveis, resumo de KPIs no topo

### Cenário 2: Visualizar resumo de impressões
- **Given** tela aberta
- **When** usuário observa seção de resumo
- **Then** exibe: total de impressões (ex: 47), custo total (ex: R$1.250,00), taxa de sucesso (ex: 98%)

### Cenário 3: Filtrar por período e status
- **Given** tela aberta com filtros visíveis
- **When** seleciona data início "2026-04-01", data fim "2026-04-15", status "sucesso"
- **Then** tabela atualiza, exibindo apenas impressões bem-sucedidas em abril (1–15)

### Cenário 4: Filtrar por cliente
- **Given** filtros visíveis
- **When** seleciona cliente "João Silva"
- **Then** tabela exibe apenas impressões vinculadas a pedidos desse cliente

### Cenário 5: Buscar por número de pedido
- **Given** campo de busca visível
- **When** usuário digita "ORD-001"
- **Then** tabela filtra em tempo real, mostrando impressões do pedido ORD-001

### Cenário 6: Visualizar detalhe expandido
- **Given** tabela com impressões visível
- **When** usuário clica em uma linha ou no ID da impressão
- **Then** drawer abre exibindo: ID, data/hora, cliente, pedido (link), status, papel, qualidade, cores, custo registrado, e se houver erro, o motivo

### Cenário 7: Reprocessar impressão com erro
- **Given** detalhe expandido de impressão com status "erro"
- **When** usuário clica "Reprocessar"
- **Then** modal pede confirmação: "Reprocessar impressão XXX?"
- **Then** usuário confirma, impressão retorna à fila (status muda para "pendente"), toast "Impressão reprocessada"
- **Then** drawer fecha, tabela atualiza

### Cenário 8: Visualizar documento PDF
- **Given** detalhe expandido de impressão com status "sucesso"
- **When** usuário clica "Ver Documento"
- **Then** modal PDF Preview abre (spec 0006) exibindo PDF associado à impressão (se houver arquivo)

### Cenário 9: Sorting por custo
- **Given** tabela visível
- **When** usuário clica no header "Custo Registrado"
- **Then** tabela ordena por custo (crescente/decrescente alternando), ícone de seta aparece no header

### Cenário 10: Export de dados
- **Given** tabela com filtros aplicados
- **When** usuário clica botão "Export"
- **Then** dropdown abre com opções: "CSV", "PDF"
- **When** seleciona "CSV"
- **Then** arquivo é baixado com dados da tabela filtrada (colunas: ID, data, cliente, pedido, status, custo)

## API Contract

Frontend consome endpoints do spec 0008 (Print Recording):
- `GET /api/print-jobs` — Listar com filtros, paginação, sorting
- `GET /api/print-jobs/:id` — Detalhe de uma impressão
- `POST /api/print-jobs/:id/reprocess` — Reenviar para fila (Bull)
- `GET /api/print-jobs/export` — Export filtrado em CSV/PDF (streaming)

Documentar em `sdd-docs/api/print-jobs.yaml` (conforme spec 0008).

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0008-print-recording-accounting.md](0008-print-recording-accounting.md), [0006-pdf-document-preview.md](0006-pdf-document-preview.md), [0010-manual-order-crud.md](0010-manual-order-crud.md)
- Pacotes/serviços externos: nenhum (React nativo)
- ADRs relevantes: [0002-job-queue-bull-redis.md](0002-job-queue-bull-redis.md)

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/PrintHistory.tsx` — página principal (layout da tela)
  - `src/components/domain/PrintHistoryTable.tsx` — tabela com impressões + paginação
  - `src/components/domain/PrintHistoryFilters.tsx` — barra de filtros (período, status, cliente, busca)
  - `src/components/domain/PrintHistoryDetail.tsx` — drawer/modal de detalhe expandido
  - `src/components/domain/PrintHistoryStats.tsx` — resumo de KPIs (total, custo, taxa sucesso)
  - `src/components/domain/PrintReprocessModal.tsx` — modal de confirmação para reprocessar
  - `src/hooks/usePrintHistory.ts` — hook para fetch, filtros, sorting, paginação
  - `src/services/printJobService.ts` — wrapper para chamadas de API de impressões

- **Estado da página**:
  ```typescript
  interface PrintHistoryState {
    printJobs: PrintJob[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    totalCount: number;
    sortBy?: 'date' | 'cost' | 'status' | 'customer';
    sortOrder: 'asc' | 'desc';
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: PrintJobStatus; // 'sucesso' | 'erro' | 'pendente'
      customerId?: string;
      orderId?: string;
      origin?: 'SHOPEE' | 'MANUAL' | 'ALL';
    };
    selectedPrintJob?: string; // ID para drawer
    showReprocessModal?: boolean;
  }
  ```

- **Status badges** (cores):
  - `sucesso` → verde (completado)
  - `erro` → vermelho (falhou)
  - `pendente` → amarelo/laranja (aguardando)

- **Fluxo de dados**:
  1. Página `/print-history` monta, fetch GET com filtros padrão (últimos 30 dias)
  2. PrintHistoryStats renderiza com totais e taxas
  3. PrintHistoryFilters renderiza com 4 tipos de filtro
  4. PrintHistoryTable renderiza com paginação
  5. Clique em linha → drawer abre (PrintHistoryDetail)
  6. Se erro e clica reprocess → modal de confirmação
  7. Confirmação → fetch POST `/api/print-jobs/:id/reprocess`, status atualiza, drawer fecha
  8. Clique "Ver Documento" → modal PDF Preview (spec 0006)
  9. Clique "Export" → dropdown com CSV/PDF, fetch GET com streaming

- **Sorting**:
  - Padrão: data descendente (mais recente primeiro)
  - Colunas com sort: data, custo, status, cliente
  - Ícone de seta (↑↓) no header ativo

- **Filtros com debounce**:
  - Busca por ID/pedido: debounce 300ms antes de refetch
  - Período: refetch ao mudar data
  - Status/cliente: refetch imediato

- **CSS Modules**:
  - `PrintHistory.module.css` — layout page com stats + filtros + tabela
  - `PrintHistoryTable.module.css` — tabela com hover, linhas com cores alternadas por status
  - `PrintHistoryFilters.module.css` — barra de filtros com layout flexível
  - `PrintHistoryStats.module.css` — cards de resumo (KPIs)
  - `PrintHistoryDetail.module.css` — drawer com seções de informação

- **Acessibilidade**:
  - Tabela com `role="table"`, headers com `scope="col"`
  - Sorting indicators com `aria-label="sortido por custo, descendente"`
  - Drawers com `role="dialog"` e focus trap
  - Status badges com aria-label (não só cor)
  - Botões com textos claros e aria-label descritivos
  - Tooltip no custo com `aria-describedby`

- **Testes esperados**:
  - Unit: sorting de impressões (data, custo, string)
  - Unit: formatação de custo (BRL, 2 decimais)
  - Unit: cálculo de taxa de sucesso (sucesso / total)
  - Integration: fetch de print jobs com filtros combinados
  - Integration: reprocessar impressão, status atualiza, fila recebe job
  - Integration: export CSV/PDF, arquivo baixa com dados corretos
  - E2E: abrir `/print-history` → filtrar por período → clicar detalhe → reprocessar → verificar status
  - E2E: buscar por número do pedido → resultado filtra corretamente
  - E2E: export CSV com filtros aplicados → arquivo contém dados corretos

- **Riscos**:
  - Performance: muitas impressões (100k+) → paginação obrigatória com cursor-based (não offset)
  - Export grande: pode travar se período tem 10k+ impressões → streaming e download progressivo
  - Reprocessar com sucesso anterior: garante idempotência via Shopee webhook dedup
  - Filtro de período sem limite: usuário seleciona 5 anos → timeout → validar range máximo (ex: 1 ano)
  - Drawer com tabela grande: scroll infinito dentro do drawer vs lista paginada

- **Implementação sugerida (ordem)**:
  1. Criar page `/print-history` com layout básico
  2. Criar hook `usePrintHistory` para fetch com filtros
  3. Criar `PrintHistoryStats` com totais calculados
  4. Criar `PrintHistoryTable` tabela paginada
  5. Integrar sorting com fetch
  6. Criar `PrintHistoryFilters` com 4 campos
  7. Implementar debounce em busca
  8. Criar `PrintHistoryDetail` drawer
  9. Criar `PrintReprocessModal` para reprocessar
  10. Integrar PDF Preview (spec 0006)
  11. Implementar export CSV/PDF
  12. CSS, responsividade, acessibilidade
  13. Testes E2E completos

---

**Esta spec depende de 0008 (Print Recording) e implementa o frontend de visualização e reprocessamento de impressões.**
