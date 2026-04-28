# Feature: Tela de Clientes

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a interface completa de gerenciamento de clientes: listagem com paginação e filtros, criação de novo cliente via formulário modal, edição de dados existentes, deleção com confirmação, e visualização de perfil do cliente com histórico de pedidos.

## Requisitos Funcionais

- [ ] RF1 — Tela `/customers` com listagem paginada de clientes (padrão: 25 por página)
- [ ] RF2 — Coluna de filtros na esquerda ou acima da tabela: filtro por nome, email, cidade
- [ ] RF3 — Busca em tempo real (conforme usuário digita no campo de nome)
- [ ] RF4 — Tabela com colunas: nome, email, telefone, cidade, ações (editar, deletar, ver detalhes)
- [ ] RF5 — Botão "Novo Cliente" abre modal com formulário de criação
- [ ] RF6 — Formulário com campos: nome (obrigatório), email (obrigatório, validado), telefone, endereço, cidade, estado, CEP
- [ ] RF7 — Editar cliente: clique em "editar" → mesma modal com campos preenchidos
- [ ] RF8 — Deletar cliente: clique em "deletar" → modal de confirmação mostrando quantos pedidos o cliente tem
- [ ] RF9 — Se cliente tem pedidos ativos, botão "deletar" fica desabilitado com tooltip explicando
- [ ] RF10 — Perfil do cliente (clique no nome ou botão "ver detalhes"): exibe nome, email, telefone, endereço completo, lista de pedidos recentes com status e custo
- [ ] RF11 — Validação de email único em tempo de salvamento (mensagem de erro se duplicado)
- [ ] RF12 — Toasts de feedback: "Cliente criado com sucesso", "Cliente atualizado", "Cliente deletado", "Erro ao criar cliente"

## Requisitos Não-Funcionais

- [ ] RNF1 — Listagem carregada via fetch assíncrono (loading spinner enquanto busca)
- [ ] RNF2 — Paginação com botões anterior/próxima ou dropdowns de página
- [ ] RNF3 — Responsivo: em tela pequena (<600px), tabela vira cards (mobile-friendly)
- [ ] RNF4 — CSS Modules, sem styled-components
- [ ] RNF5 — Acessibilidade: inputs com labels, modais com role="dialog", botões focáveis

## Critérios de Aceite

### Cenário 1: Abrir tela de clientes
- **Given** usuário está logado (futuro) e no layout principal
- **When** clica em "Clientes" no menu
- **Then** navegação leva a `/customers`, listagem de clientes é carregada, paginação exibida

### Cenário 2: Criar novo cliente
- **Given** usuário em tela de clientes, clica "Novo Cliente"
- **When** modal abre com formulário vazio
- **Then** usuário preenche nome="João Silva", email="joao@example.com", clica "Salvar"
- **Then** cliente é criado, modal fecha, toast "Cliente criado com sucesso", listagem atualizada

### Cenário 3: Email duplicado
- **Given** cliente "joao@example.com" já existe
- **When** usuário tenta criar novo cliente com mesmo email
- **Then** ao sair do campo de email, validação mostra: "Email já cadastrado"

### Cenário 4: Editar cliente existente
- **Given** cliente "Maria" está listado
- **When** usuário clica "editar"
- **Then** modal abre com campos preenchidos (nome="Maria", email="maria@...", etc.)
- **Then** usuário altera telefone, clica "Salvar"
- **Then** cliente é atualizado, modal fecha, toast "Cliente atualizado com sucesso"

### Cenário 5: Deletar cliente sem pedidos
- **Given** cliente "João" (sem pedidos) está listado
- **When** clica "deletar"
- **Then** modal de confirmação exibe: "Tem certeza que quer deletar 'João'? Essa ação não pode ser desfeita."
- **Then** usuário clica "Confirmar"
- **Then** cliente é deletado, modal fecha, toast "Cliente deletado com sucesso"

### Cenário 6: Bloquear deleção com pedidos ativos
- **Given** cliente "Ana" tem 3 pedidos em status "agendado"
- **When** usuário tenta clicar "deletar"
- **Then** botão "deletar" está desabilitado com ícone de aviso e tooltip: "Não é possível deletar cliente com pedidos ativos"

### Cenário 7: Visualizar perfil do cliente
- **Given** usuário em listagem de clientes
- **When** clica no nome ou botão "ver detalhes" de um cliente
- **Then** modal/drawer abre mostrando: nome, email, telefone, endereço completo, cidade/estado/CEP
- **Then** seção "Pedidos Recentes" lista últimos 5 pedidos com número, data, status, custo total

### Cenário 8: Filtro por nome
- **Given** listagem com 100+ clientes
- **When** usuário digita "silva" no campo de filtro
- **Then** tabela atualiza em tempo real, exibindo apenas clientes com "silva" no nome

### Cenário 9: Paginação
- **Given** listagem na página 1 (clientes 1–25)
- **When** clica "Próxima"
- **Then** tela carrega página 2 (clientes 26–50), barra de paginação atualiza

## API Contract

Frontend consome endpoints do spec 0009 (Customer CRUD):
- `GET /api/customers` — Listar com filtros e paginação
- `POST /api/customers` — Criar cliente
- `PATCH /api/customers/:id` — Atualizar cliente
- `DELETE /api/customers/:id` — Deletar cliente
- `GET /api/customers/:id` — Detalhe com pedidos associados

Documentar em `sdd-docs/api/customers.yaml` (conforme spec 0009).

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0009-customer-crud.md](0009-customer-crud.md)
- Pacotes/serviços externos: nenhum (React nativo + fetch)
- ADRs relevantes: nenhum

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/Customers.tsx` — página principal (layout da tela)
  - `src/components/domain/CustomerList.tsx` — tabela de clientes com paginação
  - `src/components/domain/CustomerFilters.tsx` — barra de filtros (nome, email, cidade)
  - `src/components/domain/CustomerModal.tsx` — modal para criar/editar cliente
  - `src/components/domain/CustomerProfile.tsx` — drawer/modal de perfil (detalhes + pedidos)
  - `src/components/domain/ConfirmDeleteModal.tsx` — modal de confirmação de deleção
  - `src/hooks/useCustomers.ts` — hook para fetch, paginação, filtros
  - `src/hooks/useCustomerForm.ts` — hook para validação e envio do formulário

- **Estado da página**:
  ```typescript
  interface CustomersState {
    customers: Customer[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    totalCount: number;
    filters: {
      name?: string;
      email?: string;
      city?: string;
    };
  }
  ```

- **Fluxo de dados**:
  1. Página `/customers` monta, dispara fetch de customers com filtros/paginação
  2. Enquanto carrega, mostra spinner
  3. Tabela renderiza com dados, paginação atualiza
  4. Clique "Novo Cliente" → CustomerModal abre com modo "create"
  5. Preenchimento de formulário → validação em tempo real (email unique check)
  6. Salvamento → fetch POST `/api/customers`
  7. Sucesso → toast, modal fecha, lista atualiza
  8. Clique "editar" → CustomerModal abre em modo "edit" com dados preenchidos
  9. Clique "deletar" → ConfirmDeleteModal, se com pedidos ativos, botão desabilitado
  10. Confirmação → fetch DELETE, lista atualiza
  11. Clique nome/detalhes → CustomerProfile abre com dados + pedidos recentes

- **Validação de formulário**:
  - Nome: obrigatório, trim
  - Email: obrigatório, formato RFC, unique (via API)
  - Telefone: opcional, aceita qualquer formato
  - Cidade: opcional
  - CEP: opcional, se preenchido validar formato `00000-000`

- **CSS Modules**:
  - `Customers.module.css` — layout page (grid com filtros + tabela)
  - `CustomerList.module.css` — tabela com hover, linhas com cores alternadas
  - `CustomerModal.module.css` — modal com form
  - `CustomerProfile.module.css` — drawer com 2 seções (info + pedidos)

- **Acessibilidade**:
  - Form inputs com `<label htmlFor="...">`
  - Modals com `role="dialog"` e focus trap
  - Tabela com `role="table"` e headers com `scope="col"`
  - Botões com textos claros e aria-labels
  - Filtros com debounce (não dispara fetch a cada keystroke)

- **Testes esperados**:
  - Unit: validação de email (formato, unicidade)
  - Unit: paginação (página anterior/próxima, cálculo de offset)
  - Unit: filtros (nome, email, combinação de filtros)
  - Integration: fetch de customers com filtros, paginação, listagem renderiza
  - Integration: criar/editar/deletar cliente via API, feedback imediato
  - E2E: abrir `/customers` → criar cliente → editar → deletar → verificar listagem
  - E2E: filtrar por nome → resultado atualiza, paginação reseta para 1
  - E2E: tentar deletar cliente com pedidos → botão desabilitado com tooltip

- **Riscos**:
  - Performance: listagem com 10k+ clientes → paginação obrigatória
  - Validação de email unique: check no servidor (fetch) é lento → debounce 300ms no campo
  - Soft-delete: queries devem excluir `deletedAt IS NULL` (confiar em backend)
  - Concorrência: usuário A e B deletam mesmo cliente → 2ª requisição retorna 404 (handle gracefully)
  - Responsividade: tabela com muitas colunas em mobile → converter para cards
  - Pedidos do cliente: se cliente tem 1000+ pedidos, listar "recentes" apenas (últimas 5)

- **Implementação sugerida (ordem)**:
  1. Criar page `/customers` com layout básico
  2. Criar hook `useCustomers` para fetch e estado
  3. Criar `CustomerList` table com paginação
  4. Criar `CustomerFilters` com 3 campos
  5. Integrar fetch com filtros/paginação
  6. Criar `CustomerModal` para criar/editar
  7. Validação de form em tempo real
  8. Criar `ConfirmDeleteModal` para deleção
  9. Lógica de bloqueio se cliente tem pedidos ativos
  10. Criar `CustomerProfile` drawer de detalhes
  11. CSS e responsividade
  12. Testes E2E completos

---

**Esta spec depende de 0017 (Layout) e implementa o frontend de 0009 (Customer CRUD).**
