# Feature: Tipo de Cor na Tabela de Preços

> Status: `draft` · Autor: rafarvns · Data: 2026-04-29

## Contexto

A tabela de preços atual não distingue entre impressões em preto e branco e impressões coloridas, que têm custos diferentes. É necessário adicionar o campo de tipo de cor para que cada entrada de preço possa ser definida especificamente para P&B ou colorido.

## Requisitos Funcionais

- [ ] RF1 — O campo `colorType` deve ser adicionado à entidade de preço no domínio, com os valores possíveis `BLACK_WHITE` e `COLOR`.
- [ ] RF2 — O schema do banco de dados deve refletir o novo campo (migration Prisma).
- [ ] RF3 — Ao cadastrar ou editar uma entrada na tabela de preços, o usuário deve poder selecionar o tipo de cor (P&B ou Colorido).
- [ ] RF4 — A listagem da tabela de preços deve exibir o tipo de cor de cada entrada.
- [ ] RF5 — O filtro da tabela de preços deve permitir filtrar por tipo de cor.
- [ ] RF6 — O campo deve ser obrigatório — não é permitido cadastrar preço sem informar o tipo de cor.

## Requisitos Não-Funcionais

- [ ] RNF1 — (performance) A consulta de preço por tipo de cor deve usar índice no banco — alvo <50ms em máquinas 4GB RAM/dual-core.
- [ ] RNF2 — (validação) O valor do enum `colorType` deve ser validado via Zod no DTO antes de chegar ao use case.

## Critérios de Aceite

### Cenário 1: Cadastro com tipo de cor obrigatório
- **Given** o usuário está na tela de tabela de preços e clica em "Adicionar preço"
- **When** tenta salvar sem selecionar o tipo de cor
- **Then** o formulário exibe erro de validação e não persiste o registro

### Cenário 2: Cadastro com tipo de cor selecionado
- **Given** o usuário preenche todos os campos do preço e seleciona "Colorido"
- **When** clica em salvar
- **Then** o registro é criado com `colorType = COLOR` e aparece na listagem com a indicação "Colorido"

### Cenário 3: Filtrar por tipo de cor
- **Given** a tabela de preços tem entradas de P&B e colorido
- **When** o usuário filtra por "Preto e Branco"
- **Then** apenas as entradas com `colorType = BLACK_WHITE` são exibidas

### Cenário 4: Migração retroativa
- **Given** existem registros na tabela de preços sem `colorType`
- **When** a migration é executada
- **Then** os registros existentes recebem um valor padrão definido na migration (a definir: `BLACK_WHITE` ou campo nullable)

## API Contract

Verificar e atualizar `sdd-docs/api/price-table.yaml` (criar se não existir) com:
- `GET /price-table` — incluir `colorType` no response
- `POST /price-table` — incluir `colorType` como campo obrigatório no body
- `PUT /price-table/:id` — incluir `colorType` como campo editável

## Dependências

- Specs relacionadas: [0007-print-parameters-configuration.md](0007-print-parameters-configuration.md), [0010-manual-order-crud.md](0010-manual-order-crud.md)
- Pacotes/serviços externos: Prisma (migration), Zod (validação)
- ADRs relevantes: nenhum ainda

## Notas de Implementação

- Camadas afetadas: domain (entidade PriceTable + enum ColorType) / application (DTO + use cases) / infrastructure (Prisma schema + migration) / frontend (formulário + tabela + filtro)
- Testes esperados: unit (entidade, use case), integration (repository + endpoint), e2e (fluxo de cadastro e filtro)
- Riscos: definir o valor padrão para registros existentes na migration — discutir com o usuário se deve ser `BLACK_WHITE`, `NULL` (campo nullable) ou exigir preenchimento manual
