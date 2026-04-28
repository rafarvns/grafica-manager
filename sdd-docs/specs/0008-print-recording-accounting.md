# Feature: Print Recording and Accounting

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Registrar automaticamente todos os eventos de impressão (data, hora, documento, parâmetros, status, custo) em banco de dados de forma imutável para auditoria, contabilização de custos e análise de uso.

## Requisitos Funcionais

- [x] RF1 — Registrar cada impressão com timestamp, documento, parâmetros (papel, qualidade, CMYK, DPI) e pedido vinculado
- [x] RF2 — Capturar status de impressão (sucesso, erro, cancelada)
- [x] RF3 — Calcular e registrar custo no momento da impressão com base na tabela de preços unitários configurada pelo usuário
- [x] RF4 — Custo registrado é imutável — mudanças futuras na tabela de preços não retroagem
- [x] RF5 — Listar histórico de impressões com filtros (período, documento, pedido, status)
- [x] RF6 — Armazenar informações de erro para troubleshooting posterior
- [x] RF7 — CRUD da tabela de preços unitários (ex.: "Sulfite A4 PB econômico = R$ 0,30/pág")

## Requisitos Não-Funcionais

- [x] RNF1 — Registro assíncrono (não bloqueia o fluxo de impressão)
- [x] RNF2 — Histórico de impressões mantido indefinidamente (sem expiração)
- [x] RNF3 — Registros são imutáveis após criação (auditoria — sem UPDATE, sem DELETE)
- [x] RNF4 — Query de histórico otimizada com índices (suporta filtros múltiplos sem timeout)
- [x] RNF5 — Arquivos do cliente (PDFs) disponíveis enquanto o pedido estiver ativo; quando o servidor de arquivos os expirar, o registro de impressão permanece, mas sem o arquivo

## Critérios de Aceite

### Cenário 1: Registrar impressão bem-sucedida
- **Given** documento enviado para impressão com parâmetros (Sulfite A4, PB, econômico, 150DPI)
- **When** impressão é completada com sucesso
- **Then** registro criado no banco com: timestamp, documento, parâmetros, custo calculado da tabela de preços vigente, status "sucesso"

### Cenário 2: Custo imutável após alteração de preço
- **Given** impressão registrada com custo R$ 0,30 (preço vigente na época)
- **When** usuário altera preço do papel para R$ 0,40
- **Then** registro histórico permanece com R$ 0,30 (imutável)

### Cenário 3: Registrar erro de impressão
- **Given** impressora desconectada ou sem papel
- **When** falha na impressão
- **Then** registro criado com status "erro" e mensagem de erro da impressora; custo = 0

### Cenário 4: Consultar histórico
- **Given** múltiplas impressões registradas
- **When** usuário filtra por período (últimos 30 dias) e status (sucesso)
- **Then** lista exibe todas as impressões do período com custo individual

### Cenário 5: Cadastrar preço unitário
- **Given** usuário acessa tabela de preços
- **When** cadastra "Couchê Colorido Alta Qualidade = R$ 2,50/pág"
- **Then** próximas impressões desse tipo usam o novo preço; histórico anterior não muda

## API Contract

Backend endpoints (obrigatório):
- `POST /api/print-jobs` — Registrar nova impressão (chamado pelo módulo de impressão)
- `GET /api/print-jobs` — Listar histórico com filtros (período, pedido, status)
- `GET /api/print-jobs/:id` — Detalhe de uma impressão
- `GET /api/price-table` — Listar tabela de preços unitários
- `POST /api/price-table` — Criar entrada de preço
- `PATCH /api/price-table/:id` — Editar entrada de preço
- `DELETE /api/price-table/:id` — Deletar entrada de preço

Documentar em `sdd-docs/api/print-jobs.yaml`.

## Dependências

- Specs relacionadas: [0005-integracao-impressoras.md](0005-integracao-impressoras.md), [0007-print-parameters-configuration.md](0007-print-parameters-configuration.md), [0011-order-print-customer-linking.md](0011-order-print-customer-linking.md)
- Pacotes/serviços externos: nenhum (Prisma + MySQL)
- ADRs relevantes: ADR a criar documentando imutabilidade de registros e snapshot de custo

## Notas de Implementação

- **Decisões tomadas**:
  - Custo calculado e congelado no momento da impressão (snapshot do preço vigente). Nunca recalcular retroativamente.
  - Histórico mantido indefinidamente. Sem expiração de registros de impressão.
  - Sem roles/permissões — usuário único (dono do sistema).
  - Arquivos PDF associados ao pedido têm ciclo de vida próprio (gerenciado pelo servidor de arquivos futuro); o registro de impressão sobrevive mesmo se o arquivo for expirado.
- **Camadas afetadas**:
  - Domain: `PrintJob` entity (imutável após criação), `CostSnapshot` value object, `PriceTable` entity, `PrintJobRepository` interface
  - Application: `RecordPrintJobUseCase` (calcula custo via tabela vigente), `ListPrintJobsUseCase`, `ManagePriceTableUseCase`
  - Infrastructure: Prisma models `PrintJob` (sem update/delete), `PriceTableEntry`, controllers HTTP
  - Frontend: tela de histórico de impressões, CRUD da tabela de preços
- **Testes esperados**:
  - Unit: cálculo de custo (busca preço correto na tabela), validação de parâmetros
  - Integration: CRUD de PrintJob no banco, imutabilidade (sem UPDATE aceito), filtros e agregações
  - E2E: fluxo impressão → registro → visualização no histórico → alteração de preço não afeta histórico
- **Riscos**:
  - Assincronicidade: se app fechar durante registro, evento pode ser perdido — usar transação atômica
  - Tabela de preços: se não houver entrada para o tipo de impressão, qual comportamento? (bloquear ou usar custo zero + aviso)
  - Performance: tabela cresce rápido; índices em `created_at`, `order_id`, `status` são essenciais
