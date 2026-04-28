# Feature: Customer CRUD

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar operações completas de gerenciamento de clientes (criar, ler, atualizar, deletar) com validação de dados, busca filtrada e bloqueio de deleção quando houver pedidos ativos.

## Requisitos Funcionais

- [ ] RF1 — Criar cliente com campos obrigatórios: nome e email; campos opcionais: telefone, endereço, cidade, estado, CEP, observações
- [ ] RF2 — Listar clientes com paginação e filtros (nome, email, cidade)
- [ ] RF3 — Buscar cliente por ID com todos os dados e resumo de pedidos
- [ ] RF4 — Atualizar dados de cliente
- [ ] RF5 — Deletar cliente — bloqueado se houver pedidos ativos; permitido apenas se não tiver pedidos ou se todos estiverem cancelados/concluídos
- [ ] RF6 — Restaurar cliente deletado (soft-delete reversa)

## Requisitos Não-Funcionais

- [ ] RNF1 — Email único por cliente (unique constraint no banco + validação na application)
- [ ] RNF2 — Validação de email (formato RFC)
- [ ] RNF3 — Telefone opcional; sem validação de formato obrigatória (aceitar qualquer string)
- [ ] RNF4 — Paginação eficiente com índices (suporta 10000+ clientes)
- [ ] RNF5 — Soft-delete: cliente deletado não aparece em listagens, mas mantém histórico de pedidos

## Critérios de Aceite

### Cenário 1: Criar cliente com campos mínimos
- **Given** formulário de novo cliente aberto
- **When** usuário preenche apenas nome e email válidos e clica "Salvar"
- **Then** cliente é criado e exibido na lista

### Cenário 2: Validar email duplicado
- **Given** cliente com email "joao@example.com" já existe
- **When** usuário tenta criar novo cliente com o mesmo email
- **Then** erro: "Email já cadastrado"

### Cenário 3: Bloquear deleção com pedidos ativos
- **Given** cliente "Maria" tem pedidos em status "em produção"
- **When** usuário tenta deletar o cliente
- **Then** erro: "Cliente possui pedidos ativos. Conclua ou cancele os pedidos antes de deletar."

### Cenário 4: Permitir deleção sem pedidos ativos
- **Given** cliente "João" tem apenas pedidos cancelados ou concluídos
- **When** usuário deleta o cliente e confirma
- **Then** cliente recebe soft-delete e sai da listagem; pedidos históricos permanecem

### Cenário 5: Listar e filtrar clientes
- **Given** múltiplos clientes cadastrados
- **When** usuário filtra por nome "Silva"
- **Then** lista exibe apenas clientes cujo nome contém "Silva", com paginação

## API Contract

Backend endpoints (obrigatório):
- `POST /api/customers` — Criar cliente
- `GET /api/customers` — Listar com filtros e paginação
- `GET /api/customers/:id` — Detalhe com resumo de pedidos
- `PATCH /api/customers/:id` — Atualizar cliente
- `DELETE /api/customers/:id` — Deletar (soft-delete, bloqueado se pedidos ativos)
- `POST /api/customers/:id/restore` — Restaurar cliente deletado

Documentar em `sdd-docs/api/customers.yaml`.

## Dependências

- Specs relacionadas: [0001-schema-banco-dados.md](0001-schema-banco-dados.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0011-order-print-customer-linking.md](0011-order-print-customer-linking.md)
- Pacotes/serviços externos: nenhum (Prisma + MySQL)
- ADRs relevantes: nenhum necessário (decisão de soft-delete definida)

## Notas de Implementação

- **Decisões tomadas**:
  - Campos obrigatórios: apenas `name` e `email`. Demais (telefone, endereço, cidade, estado, CEP) são opcionais.
  - Soft-delete: cliente deletado não aparece em listas, mas histórico de pedidos preservado.
  - Deleção bloqueada se cliente tiver pedidos com status ativo (não cancelado e não concluído).
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: `Customer` entity, `Email` value object, `CustomerRepository` interface, regra de negócio de deleção
  - Application: `CreateCustomerUseCase`, `ListCustomersUseCase`, `UpdateCustomerUseCase`, `DeleteCustomerUseCase` (valida pedidos ativos), validadores Zod
  - Infrastructure: Prisma `Customer` model com `deletedAt`, unique constraint em `email`, índices em `name`/`city`
  - Frontend: CRUD forms, lista com filtros, confirmação de deleção com contagem de pedidos
- **Testes esperados**:
  - Unit: validação de email (formato, unicidade), regra de bloqueio de deleção
  - Integration: CRUD no banco, soft-delete, filtros e paginação, bloqueio com pedidos ativos
  - E2E: fluxo criar → listar → editar → tentar deletar com pedido ativo (ver bloqueio) → concluir pedido → deletar
- **Riscos**:
  - Soft-delete: queries devem sempre incluir `WHERE deletedAt IS NULL` (risco de vazar dados deletados)
  - Email único: unique constraint no banco como segunda linha de defesa após validação na application
