# Feature: Metrics and Analytics Dashboard

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar um dashboard com visualizações de KPIs do negócio (impressões, pedidos, custos, receita, margem), atualizado manualmente pelo usuário, para suporte a decisões rápidas.

## Requisitos Funcionais

- [ ] RF1 — Exibir 7 KPIs principais (ver lista abaixo)
- [ ] RF2 — Gráfico de tendência de impressões (últimos 7 dias)
- [ ] RF3 — Gráfico de distribuição de pedidos por origem (Shopee vs. manual)
- [ ] RF4 — Tabela de top 5 clientes por faturamento no período selecionado
- [ ] RF5 — Análise de custos e margem bruta do período
- [ ] RF6 — Filtro de período (hoje, semana, mês, período customizado)
- [ ] RF7 — Botão "Atualizar" para recarregar dados sob demanda (sem polling automático)
- [ ] RF8 — Export do dashboard como PDF (snapshot dos gráficos e tabelas)

**KPIs definidos:**
1. Total de impressões hoje
2. Pedidos em aberto (rascunho + agendado + em produção)
3. Faturamento do mês corrente (R$)
4. Custo do mês corrente (R$)
5. Margem bruta do mês (%)
6. Pedidos novos nesta semana (total e por origem)
7. Cliente com maior faturamento no mês

## Requisitos Não-Funcionais

- [ ] RNF1 — Dados carregados apenas quando usuário clica "Atualizar" (sem polling/refresh automático)
- [ ] RNF2 — Carregar dashboard em < 3 segundos após clique em "Atualizar" (10k+ registros)
- [ ] RNF3 — Biblioteca de gráficos: Chart.js (leve, ~50KB gzipped)
- [ ] RNF4 — Queries com índices e aggregate pushdown (sem N+1)
- [ ] RNF5 — Sem sistema de cache — dados são calculados frescos a cada "Atualizar"

## Critérios de Aceite

### Cenário 1: Visualizar KPIs ao abrir dashboard
- **Given** usuário acessa a tela de dashboard
- **When** página carrega pela primeira vez
- **Then** exibe os 7 cards de KPI com dados do dia/mês corrente; botão "Atualizar" visível

### Cenário 2: Filtrar por período
- **Given** dashboard aberto com dados padrão (mês atual)
- **When** usuário seleciona "últimos 7 dias" e clica "Atualizar"
- **Then** todos os KPIs, gráficos e tabelas são recalculados para o período selecionado

### Cenário 3: Gráfico de tendência de impressões
- **Given** dados de impressões disponíveis
- **When** gráfico de linha é renderizado (Chart.js)
- **Then** eixo X = datas, eixo Y = quantidade, linha com pontos por dia

### Cenário 4: Top 5 clientes
- **Given** múltiplos clientes com pedidos
- **When** seção "Top Clientes" é visualizada
- **Then** tabela exibe: posição, nome, total faturado no período, número de pedidos

### Cenário 5: Margem bruta
- **Given** pedidos com salePrice e printJobs com custo registrado
- **When** card de margem é exibido
- **Then** margem bruta = ((faturamento − custo de impressões) / faturamento) × 100

### Cenário 6: Exportar dashboard como PDF
- **Given** dashboard com dados carregados
- **When** usuário clica "Exportar PDF"
- **Then** PDF gerado com snapshot dos gráficos (Chart.js canvas → imagem) e tabelas do período

## API Contract

Backend endpoints (obrigatório):
- `GET /api/metrics/dashboard` — Todos os dados do dashboard (período via query params)
- `GET /api/metrics/kpis` — KPIs individuais
- `GET /api/metrics/print-trends` — Dados do gráfico de tendência (por dia)
- `GET /api/metrics/order-origin` — Distribuição por origem (Shopee vs. manual)
- `GET /api/metrics/top-customers` — Top 5 clientes por faturamento
- `GET /api/metrics/cost-analysis` — Faturamento, custo e margem do período
- `POST /api/metrics/export` — Gerar PDF do dashboard

Documentar em `sdd-docs/api/metrics.yaml`.

## Dependências

- Specs relacionadas: [0008-print-recording-accounting.md](0008-print-recording-accounting.md), [0009-customer-crud.md](0009-customer-crud.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0011-order-print-customer-linking.md](0011-order-print-customer-linking.md)
- Pacotes/serviços externos:
  - Chart.js (gráficos — ~50KB gzipped, sem runtime pesado)
  - jsPDF ou html2canvas (export PDF)
- ADRs relevantes: nenhum necessário

## Notas de Implementação

- **Decisões tomadas**:
  - Atualização manual — usuário clica "Atualizar"; sem polling, sem websocket, sem cache.
  - Chart.js como biblioteca de gráficos (mais leve que Recharts para o target 4GB RAM/dual-core).
  - Sem roles — usuário único; acesso irrestrito ao dashboard.
  - KPIs definidos (7 métricas listadas em RF1).
  - Margem bruta calculada em runtime: `(faturamento − custo) / faturamento × 100`.
- **Camadas afetadas**:
  - Domain: `DashboardMetrics` value object, `PeriodFilter` value object
  - Application: `GetDashboardMetricsUseCase`, `GetTopCustomersUseCase`, `GetCostAnalysisUseCase`
  - Infrastructure: queries SQL com aggregate (SUM, COUNT, GROUP BY) com índices; export PDF
  - Frontend: página de dashboard, 7 KPI cards, Chart.js (linha + pizza), tabela top clientes, datepicker de período, botão "Atualizar", botão "Exportar PDF"
- **Testes esperados**:
  - Unit: cálculo de margem bruta, filtro de período, formatação de valores
  - Integration: queries de agregação com dados reais no banco, performance com 10k+ registros
  - E2E: abrir dashboard → selecionar período → clicar Atualizar → verificar valores → exportar PDF
- **Riscos**:
  - Queries agregadas com múltiplos JOINs podem ser lentas sem índices compostos — `created_at` é crítico
  - Chart.js canvas → PDF pode perder qualidade; testar com html2canvas como alternativa
  - Sem cache: se o usuário clicar "Atualizar" muitas vezes em sequência, DB pode ser sobrecarregado — debounce no botão (500ms)
