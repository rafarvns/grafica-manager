# Feature: Detailed Reports

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar sistema de relatórios detalhados por múltiplas dimensões (período, cliente, origem, tipo de impressão, custos, margens), com filtros avançados e download imediato em múltiplos formatos.

## Requisitos Funcionais

- [ ] RF1 — Relatório por período (dia, semana, mês, trimestre, ano, período customizado) — **período é obrigatório**
- [ ] RF2 — Filtro por cliente (opcional)
- [ ] RF3 — Filtro por origem do pedido (Shopee, manual, ou todos)
- [ ] RF4 — Filtro por tipo de papel (opcional)
- [ ] RF5 — Agrupamento customizável (agrupar por cliente / papel / origem / período)
- [ ] RF6 — Colunas sempre exibidas: quantidade de impressões, custo total, receita total, margem bruta (%)
- [ ] RF7 — Ordenação por qualquer coluna (ASC/DESC)
- [ ] RF8 — Paginação de resultados (25, 50, 100 linhas por página)
- [ ] RF9 — Export em PDF: download direto (não armazenado no servidor)
- [ ] RF10 — Export em CSV: download direto
- [ ] RF11 — Export em Excel (.xlsx): download direto
- [ ] RF12 — Relatório de margens por cliente: receita, custo, margem bruta (%), margem líquida (%)

## Requisitos Não-Funcionais

- [ ] RNF1 — Período obrigatório em todos os relatórios (sem relatório "de tudo sem filtro de data")
- [ ] RNF2 — Geração sem bloqueio de UI (background job para datasets grandes; download quando pronto)
- [ ] RNF3 — Sem limite de linhas para export — usar streaming para arquivos grandes
- [ ] RNF4 — Relatórios não são armazenados no servidor — disponibilizados para download imediato e descartados
- [ ] RNF5 — Queries otimizadas com índices compostos (período + cliente + origem)
- [ ] RNF6 — Sem agendamento automático de relatórios (out of scope)

## Critérios de Aceite

### Cenário 1: Gerar relatório básico por período
- **Given** usuário em tela de relatórios
- **When** seleciona período "abril/2026" e clica "Gerar"
- **Then** relatório exibe: impressões do período, quantidade total, custo total, receita total, margem

### Cenário 2: Filtros combinados
- **Given** relatório aberto
- **When** usuário filtra: período=abril, cliente=Maria, origem=Shopee
- **Then** relatório exibe apenas impressões que atendem todos os critérios simultaneamente

### Cenário 3: Período obrigatório
- **Given** formulário de relatório aberto
- **When** usuário clica "Gerar" sem selecionar período
- **Then** validação exibe: "Selecione um período para gerar o relatório"

### Cenário 4: Agrupar por tipo de papel
- **Given** relatório com múltiplos tipos de papel no período
- **When** usuário seleciona "Agrupar por: Papel"
- **Then** relatório reorganizado: A4 (X impressões, R$ Y custo, R$ Z receita), A3 (...)

### Cenário 5: Export CSV com streaming
- **Given** relatório com 50k linhas
- **When** usuário clica "Export → CSV"
- **Then** arquivo CSV é gerado via streaming e download iniciado sem travar a UI

### Cenário 6: Relatório de margens por cliente
- **Given** múltiplos clientes com pedidos no período
- **When** usuário gera "Relatório de Margens"
- **Then** tabela: cliente, receita total, custo total de impressões, margem bruta (%), margem líquida (%)

## API Contract

Backend endpoints (obrigatório):
- `POST /api/reports/generate` — Gerar relatório com filtros e grouping (retorna dados ou inicia job)
- `GET /api/reports/export/pdf` — Export em PDF (streaming, download direto)
- `GET /api/reports/export/csv` — Export em CSV (streaming, download direto)
- `GET /api/reports/export/excel` — Export em Excel (streaming, download direto)

Documentar em `sdd-docs/api/reports.yaml`.

## Dependências

- Specs relacionadas: [0008-print-recording-accounting.md](0008-print-recording-accounting.md), [0009-customer-crud.md](0009-customer-crud.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0015-metrics-analytics-dashboard.md](0015-metrics-analytics-dashboard.md)
- Pacotes/serviços externos:
  - jsPDF (PDF)
  - papaparse (CSV streaming)
  - xlsx ou exceljs (Excel)
- ADRs relevantes: nenhum necessário

## Notas de Implementação

- **Decisões tomadas**:
  - Período obrigatório em todos os relatórios — sem exceção.
  - Sem agendamento automático — out of scope.
  - Sem armazenamento de relatórios gerados — download direto e descartado.
  - Sem limite de linhas — streaming para datasets grandes (CSV via pipe, PDF paginado).
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: `ReportFilter` value object (período obrigatório), `ReportGrouping` enum, `MarginCalculator`
  - Application: `GenerateReportUseCase` (valida período, aplica filtros), `ExportReportUseCase` (streaming)
  - Infrastructure: query builder Prisma com aggregate + GROUP BY, PDF/CSV/Excel exporters com streaming
  - Frontend: formulário de filtros (datepicker obrigatório, opcionais: cliente, origem, papel), seletor de agrupamento, tabela com sorting/paginação, botões de export
- **Testes esperados**:
  - Unit: validação de período obrigatório, construção de filtros combinados, cálculo de margens
  - Integration: query com múltiplos filtros + GROUP BY no banco, streaming de CSV com 10k+ linhas
  - E2E: selecionar período → aplicar filtros → gerar → verificar dados → exportar CSV → verificar arquivo
- **Riscos**:
  - Streaming de PDF com muitas páginas: jsPDF carrega tudo em memória — paginar ou usar alternativa (Puppeteer headless) para datasets grandes
  - Query com GROUP BY em múltiplas dimensões combinadas pode ser lenta — índices compostos essenciais
  - Export Excel: biblioteca xlsx carrega em memória — para grandes volumes, usar exceljs com streaming
