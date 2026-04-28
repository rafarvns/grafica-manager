# Feature: Tela de Relatórios

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a interface de relatórios detalhados da gráfica: geração dinâmica de relatórios com filtros avançados (período obrigatório, cliente, tipo de papel, origem), seleção de agrupamento (por cliente, pedido, papel, origem Shopee/manual), tabela de resultados com KPIs, sorting e export em múltiplos formatos (CSV, PDF, Excel). Relatórios são não persistidos (gerados on-demand, streaming).

## Requisitos Funcionais

- [ ] RF1 — Tela `/reports` com painel de filtros e gerador de relatório
- [ ] RF2 — Painel de Filtros (lado esquerdo ou acima):
  - [ ] RF2a — Período (obrigatório): data início e data fim com datepicker (máximo 1 ano de intervalo)
  - [ ] RF2b — Cliente (opcional): dropdown com multi-select ou single
  - [ ] RF2c — Tipo de papel (opcional): dropdown multi-select
  - [ ] RF2d — Origem (opcional): checkbox para "Shopee" e "Manual"
  - [ ] RF2e — Status do pedido (opcional): multi-select (draft, scheduled, in_production, completed, shipping, cancelled)
  - [ ] RF2f — Botão "Gerar Relatório" dispara fetch com filtros
  - [ ] RF2g — Validação inline: período obrigatório, início <= fim
- [ ] RF3 — Seletor de Agrupamento:
  - [ ] RF3a — Radio buttons: "Por Cliente", "Por Pedido", "Por Papel", "Por Origem", "Sem agrupamento"
  - [ ] RF3b — Agrupamento afeta colunas da tabela e cálculos de subtotais
  - [ ] RF3c — Default: "Por Pedido"
- [ ] RF4 — Tabela de Resultados (dinâmica conforme agrupamento):
  - [ ] RF4a — Sem agrupamento: colunas = número pedido, cliente, papel, quantidade, preço venda, custo, margem (%), data
  - [ ] RF4b — Agrupado por cliente: seções com nome do cliente, subtotal venda/custo/margem, depois lista de pedidos
  - [ ] RF4c — Agrupado por papel: seções com tipo de papel, subtotal quantidade/venda/custo, depois lista de pedidos
  - [ ] RF4d — Agrupado por origem: seções (Shopee | Manual), subtotais, depois pedidos
  - [ ] RF4e — Cada linha de detalhe é clicável → abre detalhe de pedido (spec 0020)
- [ ] RF5 — Totalizadores (rodapé da tabela ou painel flutuante):
  - [ ] RF5a — Total de pedidos, quantidade total impressa, custo total, preço total, margem total (R$ e %)
  - [ ] RF5b — Ticket médio (preço / quantidade de pedidos)
- [ ] RF6 — Paginação: 50 registros por página, botões anterior/próxima, selector de página
- [ ] RF7 — Sorting: clique no header para ordenar colunas (data, cliente, custo, margem, etc.)
- [ ] RF8 — Busca rápida: campo de filtro de texto para buscar em cliente/pedido (filtra tabela, não refaz fetch)
- [ ] RF9 — Export de dados:
  - [ ] RF9a — Botão "Exportar" com dropdown: CSV, PDF, Excel
  - [ ] RF9b — Export respeita filtros, agrupamento e sorting aplicados
  - [ ] RF9c — PDF com cabeçalho (dados da gráfica — spec 0025), data de geração, filtros aplicados
  - [ ] RF9d — Excel com formatação (cores por agrupamento, subtotais em negrito)
- [ ] RF10 — Carregamento incremental: spinner enquanto fetch, botão "Gerar Relatório" desabilitado
- [ ] RF11 — Responsividade: em mobile, tabela vira cards agrupados por cliente/papel

## Requisitos Não-Funcionais

- [ ] RNF1 — Relatório é gerado on-demand via fetch streaming (não persiste em banco)
- [ ] RNF2 — Período máximo: 1 ano (validar no cliente e servidor)
- [ ] RNF3 — Export é streaming (não carrega tudo em memória) — para grandes períodos (100k+ linhas)
- [ ] RNF4 — CSS Modules, sem styled-components
- [ ] RNF5 — Acessibilidade: inputs com labels, tabelas com headers semânticos, botões com aria-label
- [ ] RNF6 — Performance: relatório de 1 ano com 10k+ pedidos deve carregar em < 5s

## Critérios de Aceite

### Cenário 1: Abrir tela de relatórios
- **Given** usuário no layout principal
- **When** clica em "Relatórios" no menu
- **Then** navegação leva a `/reports`, painel de filtros visível, campo de período vazio, botão "Gerar Relatório" desabilitado

### Cenário 2: Validação de período obrigatório
- **Given** painel de filtros visível
- **When** usuário tenta clicar "Gerar Relatório" sem preencher período
- **Then** erro inline: "Período é obrigatório"
- **Then** botão continua desabilitado

### Cenário 3: Validação de período máximo
- **Given** usuário seleciona data início "2024-01-01", data fim "2026-12-31" (3 anos)
- **When** clica "Gerar Relatório"
- **Then** erro: "Período não pode exceder 1 ano"

### Cenário 4: Gerar relatório sem filtros adicionais
- **Given** painel com período preenchido "2026-04-01" a "2026-04-30"
- **When** clica "Gerar Relatório"
- **Then** spinner aparece, fetch inicia
- **Then** tabela carrega com pedidos de abril: pedido 1, cliente João, papel Couchê, preço R$500, custo R$100, margem 80%, data 2026-04-05
- **Then** rodapé exibe: Total 15 pedidos, 150 unidades, custo R$1.500, venda R$7.500, margem R$6.000 (80%)

### Cenário 5: Filtrar por cliente
- **Given** filtros visíveis
- **When** seleciona cliente "Maria Silva"
- **When** clica "Gerar Relatório"
- **Then** tabela exibe apenas pedidos de Maria no período

### Cenário 6: Filtrar por múltiplos clientes
- **Given** dropdown de cliente com multi-select
- **When** seleciona "João", "Maria", "Pedro"
- **When** clica "Gerar Relatório"
- **Then** tabela exibe pedidos dos 3 clientes combinados

### Cenário 7: Agrupamento por cliente
- **Given** relatório gerado
- **When** seleciona radio "Por Cliente"
- **Then** tabela reorganiza: seção "João Silva" com subtotal venda/custo, depois lista de pedidos dele
- **Then** seção "Maria" com subtotal dela, depois pedidos
- **Then** rodapé com total geral

### Cenário 8: Agrupamento por papel
- **Given** radio "Por Papel" selecionado
- **When** relatório é gerado
- **Then** tabela reorganiza: seção "Couchê" com subtotal (quantidade, venda, custo), depois lista de pedidos com esse papel
- **Then** seção "Sulfite" com subtotal dela
- **Then** rodapé com total geral

### Cenário 9: Sorting por margem
- **Given** tabela visível
- **When** clica header "Margem (%)"
- **Then** tabela ordena por margem descendente, ícone de seta aparece
- **When** clica novamente
- **Then** ordena crescente

### Cenário 10: Busca rápida na tabela
- **Given** relatório com 100+ pedidos
- **When** digita "João" no campo de busca
- **Then** tabela filtra mostrando apenas linhas com "João" no cliente, em tempo real (sem refetch)

### Cenário 11: Exportar em CSV
- **Given** relatório gerado com 50 pedidos
- **When** clica "Exportar" → "CSV"
- **Then** arquivo `.csv` é baixado com colunas: número, cliente, papel, quantidade, preço, custo, margem, data
- **Then** respeitou filtros (apenas período selecionado)

### Cenário 12: Exportar em PDF
- **Given** relatório visível
- **When** clica "Exportar" → "PDF"
- **Then** spinner "Gerando PDF..." aparece
- **Then** PDF é baixado com: cabeçalho (dados da gráfica), título "Relatório de Pedidos", período, filtros aplicados, tabela de dados, rodapé com totalizadores
- **Then** PDF tem formatação clara (cores, fontes, alinhamento)

### Cenário 13: Exportar em Excel
- **Given** relatório com agrupamento por cliente
- **When** clica "Exportar" → "Excel"
- **Then** arquivo `.xlsx` é baixado com: abas para cada cliente (ou uma aba com agrupamento), subtotais em negrito, cores por agrupamento

### Cenário 14: Ticket médio
- **Given** relatório com 15 pedidos, venda total R$7.500
- **When** visualiza rodapé
- **Then** exibe: "Ticket médio: R$500,00" (7500 / 15)

### Cenário 15: Responsividade em mobile
- **Given** tela com 480px largura
- **When** relatório é carregado
- **Then** tabela converte para cards, cada card exibe: pedido, cliente, papel, preço/custo em linha

## API Contract

Frontend consome endpoints do spec 0016 (Detailed Reports):
- `GET /api/reports/generate` — Gerar relatório com filtros (query params ou body), retorna streaming JSON
- `POST /api/reports/export` — Export de relatório em CSV/PDF/Excel (body com filtros e formato)

Documentar em `sdd-docs/api/reports.yaml`.

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0016-detailed-reports.md](0016-detailed-reports.md), [0020-order-detail-screen.md](0020-order-detail-screen.md), [0025-global-system-settings.md](0025-global-system-settings.md) (dados da gráfica para cabeçalho PDF)
- Pacotes/serviços externos: nenhum (React nativo, sem chart libs no relatório)
- ADRs relevantes: nenhum

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/Reports.tsx` — página principal
  - `src/components/domain/ReportFilters.tsx` — painel de filtros (período, cliente, papel, origem, status)
  - `src/components/domain/GroupingSelector.tsx` — radio buttons para escolher agrupamento
  - `src/components/domain/ReportTable.tsx` — tabela dinâmica (sem agrupamento ou agrupada)
  - `src/components/domain/ReportTotals.tsx` — rodapé com totalizadores e ticket médio
  - `src/components/domain/ReportExportButton.tsx` — dropdown com opções de export
  - `src/hooks/useReportGeneration.ts` — hook para fetch e estado de geração
  - `src/utils/reportFormatters.ts` — funções para formatar dados conforme agrupamento
  - `src/utils/exportGenerators.ts` — funções para gerar CSV/PDF/Excel
  - `src/services/reportService.ts` — wrapper para API

- **Estado da página**:
  ```typescript
  interface ReportsState {
    filters: {
      startDate: Date; // obrigatório
      endDate: Date;   // obrigatório
      customerIds?: string[];
      paperTypeIds?: string[];
      origin?: ('SHOPEE' | 'MANUAL')[];
      statuses?: OrderStatus[];
    };
    
    grouping: 'none' | 'customer' | 'order' | 'paper' | 'origin';
    
    report: {
      rows: ReportRow[]; // ou ReportGroupedRows se agrupado
      totals: {
        totalOrders: number;
        totalQuantity: number;
        totalCost: number;
        totalRevenue: number;
        totalMargin: number; // em R$
        marginPercent: number; // em %
        ticketAverage: number;
      };
    } | null;
    
    loading: boolean;
    error?: string;
    
    searchText?: string; // filtro local de tabela
    
    sortBy?: 'date' | 'customer' | 'cost' | 'margin';
    sortOrder: 'asc' | 'desc';
    
    pagination: { page: number; pageSize: number; totalCount: number };
    
    exporting?: { format: 'csv' | 'pdf' | 'xlsx'; inProgress: boolean };
  }
  ```

- **Tipos de dados**:
  ```typescript
  interface ReportRow {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    paperType: string;
    quantity: number;
    salePrice: number;
    cost: number;
    margin: number;
    marginPercent: number;
    date: Date;
    origin: 'SHOPEE' | 'MANUAL';
  }
  
  interface ReportGroupedRow {
    groupLabel: string; // ex: "João Silva", "Couchê", "Shopee"
    subtotal: { quantity: number; salePrice: number; cost: number; margin: number };
    rows: ReportRow[];
  }
  ```

- **Fluxo de dados**:
  1. Página `/reports` monta, painel de filtros visível
  2. Usuário preenche período (obrigatório), opcionais (cliente, papel, origem, status)
  3. Clique "Gerar Relatório" → validação inline (período, intervalo <= 1 ano)
  4. Se válido, spinner ativa, fetch GET /api/reports/generate com query params
  5. Resposta streaming JSON carrega linhas incrementalmente
  6. ReportTable renderiza com dados, ReportTotals calcula subtotais
  7. Usuário pode mudar grouping → tabela reorganiza (lado do cliente, sem refetch)
  8. Sorting: clique header → reordena rowns no estado (sem refetch)
  9. Busca: digita texto → filtra rows localmente (sem refetch)
  10. Export: dropdown → fetch POST /api/reports/export com filtros e formato
  11. File download inicia (streaming para grandes arquivos)

- **Agrupamento no cliente**:
  - Dados chegam flat (lista de ReportRow)
  - Função `groupReportRows(rows, groupingType)` reorganiza para ReportGroupedRow[]
  - Função recalcula subtotais por grupo
  - ReportTable renderiza diferente se agrupado (seções com headers/subtotals)

- **Validação de período**:
  - Client-side: início <= fim, intervalo <= 365 dias
  - Server-side: validação adicional, rejeita requisições com período inválido

- **CSS Modules**:
  - `Reports.module.css` — layout page com filtros + tabela
  - `ReportFilters.module.css` — painel de filtros (grid ou coluna)
  - `ReportTable.module.css` — tabela com ou sem agrupamento, cores por grupo
  - `ReportTotals.module.css` — rodapé com cards de KPIs

- **Export em PDF**:
  - Usa biblioteca leve (ex: html2pdf se preciso de renderização visual, ou gera direto JSON no backend)
  - Recomendação: backend gera PDF (Prisma Report ou similar), frontend faz download
  - Cabeçalho: dados da gráfica (spec 0025), título, período, filtros
  - Tabela: colunas reduzidas se agrupado (ex: sem cliente se agrupando por cliente)
  - Rodapé: data de geração, totalizadores

- **Export em Excel**:
  - Usa `xlsx` (leve, 300KB minificado)
  - Formatação: cores por grupo (azul=cliente 1, verde=papel A, etc.), subtotals em negrito
  - Pode usar uma aba por cliente (se agrupado por cliente) ou múltiplas abas

- **Acessibilidade**:
  - Inputs de período com `<label>` e datepicker acessível
  - Tabela com `role="table"`, headers `scope="col"`, rowgroups se agrupado
  - Botões com aria-label ("Gerar relatório", "Exportar como CSV")
  - Status de carregamento com `aria-live="polite"`
  - Mensagens de erro com `role="alert"`

- **Testes esperados**:
  - Unit: validação de período (início <= fim, <= 365 dias)
  - Unit: cálculo de margem (venda - custo), ticket médio
  - Unit: agrupamento de linhas por cliente/papel/origem
  - Integration: fetch de relatório com filtros (período, cliente, origem)
  - Integration: export CSV com filtros (período, dados corretos)
  - Integration: export PDF com cabeçalho (dados da gráfica)
  - E2E: abrir `/reports` → preencher período → gerar → clicar detalhe de pedido → voltar
  - E2E: agrupar por cliente → reorganiza tabela → mudar sorting → verifica ordem
  - E2E: buscar texto "João" → filtra tabela localmente
  - E2E: export CSV → arquivo baixa → abrir em planilha → verificar dados

- **Riscos**:
  - Performance: período de 1 ano com 100k+ pedidos → streaming padrão, sem preload
  - Tabela grande em mobile: 20+ colunas → cards são melhor, mas pode ficar longo
  - Export grande: 100k+ linhas em PDF → timeout ou travamento (usar backend para gerar PDF)
  - Sorting + agrupamento: se agrupar por cliente e depois sortear por custo, reordena dentro de grupos ou geral?
  - Concorrência: usuário preenche período, clica "Gerar", muda filtro, clica novamente → 2 requisições simultâneas (último vence)

- **Implementação sugerida (ordem)**:
  1. Criar page `/reports` com layout básico
  2. Criar `ReportFilters` com período + filtros opcionais
  3. Validação de período (client + server)
  4. Criar hook `useReportGeneration` para fetch
  5. Criar `ReportTable` tabela flat (sem agrupamento)
  6. Criar `ReportTotals` com cálculos
  7. Integrar fetch com filtros
  8. Criar `GroupingSelector` radio buttons
  9. Implementar agrupamento no cliente (reorganizar dados)
  10. Implementar sorting e busca local
  11. Criar `ReportExportButton` dropdown
  12. Implementar export CSV (simples)
  13. Implementar export PDF (backend)
  14. Implementar export Excel (xlsx library)
  15. CSS, responsividade (cards em mobile), acessibilidade
  16. Testes E2E completos

---

**Esta spec cobre o frontend de visualização e export de 0016 (Detailed Reports) e depende de 0025 (Global System Settings) para dados da gráfica em cabeçalhos PDF.**
