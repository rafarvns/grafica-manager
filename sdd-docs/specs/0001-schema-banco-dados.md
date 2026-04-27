# Feature: Schema de Banco de Dados (Prisma)

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Definir o modelo relacional completo do Gráfica Manager no Prisma (`schema.prisma`), cobrindo as entidades centrais identificadas no README: Printer, PrintJob, Order, Customer, Store e PrintPreset. Este schema é pré-requisito para qualquer feature dos módulos de Impressão, Pedidos e Clientes.

## Requisitos Funcionais

- [x] RF1 — Modelar a entidade `Printer` (impressoras do sistema, com campos de configuração e status ativo/inativo)
- [x] RF2 — Modelar a entidade `PrintJob` (registro de cada impressão: impressora, qualidade, papel, gramatura, perfil de cor, páginas P&B/coloridas, custo estimado)
- [x] RF3 — Modelar a entidade `Order` (pedidos com ciclo de vida: `RECEIVED → IN_PRODUCTION → PRODUCTION_DONE → PACKAGED → SHIPPED → DELIVERED`)
- [x] RF4 — Modelar a entidade `Customer` (clientes com possibilidade de vínculo a e-commerce externo)
- [x] RF5 — Modelar a entidade `Store` (lojas/fontes: Shopee, Mercado Livre, manual — com tokens de integração)
- [x] RF6 — Modelar a entidade `PrintPreset` (presets de configuração de impressão por tipo de material)
- [x] RF7 — Definir os relacionamentos: `Order → Customer`, `Order → Store`, `PrintJob → Order`, `PrintJob → Printer`, `PrintJob → PrintPreset`
- [x] RF8 — Todos os IDs como `String @id @default(uuid())` (sem auto-increment em entidades de domínio)
- [x] RF9 — Campos `createdAt` e `updatedAt` em todas as entidades principais
- [x] RF10 — Modelar a entidade `OrderFile` (arquivos do cliente vinculados a um `Order`: nome, caminho, tamanho, mimetype) para suportar o módulo de Arquivo futuro

## Requisitos Não-Funcionais

- [x] RNF1 — (performance) Índices nas chaves de busca frequente: `Order.status`, `PrintJob.printerId`, `Customer.externalId`
- [x] RNF2 — (segurança) Tokens de e-commerce em `Store` nunca expostos via API — apenas referenciados internamente
- [x] RNF3 — (integridade) Soft-delete em `Order` e `Customer` via campo `deletedAt DateTime?`; queries de listagem filtram `deletedAt: null` por padrão
- [x] RNF4 — (escalabilidade) `OrderFile` incluída no schema inicial para preparar o módulo de Arquivo (Fase 6); a lógica de auto-deleção e compactação é responsabilidade do módulo futuro, não deste schema

## Critérios de Aceite

### Cenário 1: Migration gerada sem erros
- **Given** o `schema.prisma` definido
- **When** `prisma migrate dev --name init` é executado contra MySQL 8
- **Then** a migration é criada e aplicada sem erros

### Cenário 2: Relacionamentos corretos
- **Given** um `Order` criado no banco com status `RECEIVED`
- **When** um `PrintJob` é criado vinculado a esse `Order`
- **Then** `prisma.printJob.findMany({ where: { orderId } })` retorna o job corretamente

### Cenário 3: Transição de status válida
- **Given** um `Order` com status `IN_PRODUCTION`
- **When** o status é atualizado para `PRODUCTION_DONE`
- **Then** o registro persiste com o novo status e `updatedAt` atualizado

### Cenário 4: Ciclo de vida completo
- **Given** um `Order` criado
- **When** ele percorre `RECEIVED → IN_PRODUCTION → PRODUCTION_DONE → PACKAGED → SHIPPED → DELIVERED`
- **Then** cada transição é persistida sem erros de constraint

### Cenário 5: OrderFile vinculado a Order
- **Given** um `Order` existente
- **When** um `OrderFile` é criado com `orderId` válido
- **Then** `prisma.orderFile.findMany({ where: { orderId } })` retorna o arquivo corretamente


## API Contract

N/A — esta spec não expõe endpoints HTTP. O schema é consumido internamente pelos repositories.

## Dependências

- Specs relacionadas: nenhuma (esta é a spec fundacional)
- Pacotes/serviços externos: MySQL 8+, Prisma `^5.17`
- ADRs relevantes: nenhum ainda — se houver decisão relevante (ex.: soft-delete vs hard-delete, UUID vs CUID), registrar em `sdd-docs/decisions/`

## Notas de Implementação

- Camadas afetadas: `infrastructure/database` (repositories Prisma) · `domain/entities` (entidades de domínio TypeScript)
- Testes esperados: integração — cada repository testado contra MySQL real (não SQLite)
- O schema deve evoluir apenas via `prisma migrate dev` — nunca editar o banco direto
- Enums de negócio (`OrderStatus`, `PrintQuality`, `ColorProfile`, etc.) devem ser definidos também em `packages/shared/src/constants/` para uso no frontend
- Riscos:
  - Mudanças de schema após dados em produção exigem migrations cuidadosas
  - Tokens de e-commerce em `Store` gravados encriptados no banco (AES-256 via lib leve, ex.: `aes-js` ou `crypto` nativo do Node); chave de encriptação em `.env` (`ENCRYPTION_KEY`). Exige ADR.
