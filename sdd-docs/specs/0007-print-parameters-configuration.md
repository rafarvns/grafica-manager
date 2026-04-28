# Feature: Print Parameters Configuration

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Permitir que usuários configurem parâmetros técnicos de impressão (modelo de cor, tipo de papel, qualidade, DPI) antes de enviar um documento para impressão, com tipos de papel cadastráveis e presets reutilizáveis salvos localmente.

## Requisitos Funcionais

- [ ] RF1 — Selecionar modelo de cor (CMYK, RGB, escala de cinza)
- [ ] RF2 — Escolher tipo de papel a partir de lista cadastrada pelo usuário
- [ ] RF3 — Definir qualidade de impressão (rascunho, normal, alta)
- [ ] RF4 — Configurar DPI/resolução (150, 300, 600)
- [ ] RF5 — Salvar presets de configuração reutilizáveis com nome
- [ ] RF6 — Carregar e aplicar preset salvo
- [ ] RF7 — Deletar preset salvo
- [ ] RF8 — CRUD de tipos de papel (cadastrar, editar, deletar tipos disponíveis no sistema)

## Requisitos Não-Funcionais

- [ ] RNF1 — Presets persistidos localmente no banco de dados da aplicação (não sincronizados entre máquinas)
- [ ] RNF2 — Tipos de papel persistidos no banco de dados local (cadastro permanente)
- [ ] RNF3 — Sem matriz de incompatibilidade — todas as combinações de parâmetros são permitidas
- [ ] RNF4 — Interface compacta (formulário não pode ocupar espaço excessivo em tela pequena)

## Critérios de Aceite

### Cenário 1: Configurar parâmetros básicos
- **Given** usuário em tela de preparação para impressão
- **When** acessa painel de configuração
- **Then** formulário exibe selects para cor, papel (lista cadastrada), qualidade e DPI

### Cenário 2: Salvar preset
- **Given** usuário preencheu configuração válida
- **When** clica em "Salvar como Preset" e nomeia (ex.: "Cartaz Alta Resolução")
- **Then** preset é armazenado no banco local e aparece na lista de presets

### Cenário 3: Aplicar preset existente
- **Given** presets salvos disponíveis
- **When** usuário seleciona um preset
- **Then** todos os parâmetros são preenchidos automaticamente

### Cenário 4: Cadastrar novo tipo de papel
- **Given** tipo de papel não existe na lista
- **When** usuário acessa "Gerenciar Papéis" e cria "Couchê Brilhante 150g"
- **Then** novo tipo fica disponível no select de papel em todos os formulários

### Cenário 5: Deletar tipo de papel em uso
- **Given** tipo "Sulfite A4" está associado a presets existentes
- **When** usuário tenta deletar esse tipo
- **Then** sistema alerta: "Este papel está em uso por N presets. Deseja deletar mesmo assim?" (confirmar para forçar)

## API Contract

Backend endpoints (obrigatório):
- `GET /api/paper-types` — Listar tipos de papel cadastrados
- `POST /api/paper-types` — Criar novo tipo de papel
- `PATCH /api/paper-types/:id` — Editar tipo de papel
- `DELETE /api/paper-types/:id` — Deletar tipo de papel
- `GET /api/print-presets` — Listar presets salvos
- `POST /api/print-presets` — Criar preset
- `DELETE /api/print-presets/:id` — Deletar preset

Documentar em `sdd-docs/api/print-config.yaml`.

## Dependências

- Specs relacionadas: [0005-integracao-impressoras.md](0005-integracao-impressoras.md), [0008-print-recording-accounting.md](0008-print-recording-accounting.md)
- Pacotes/serviços externos: nenhum (Prisma + MySQL local)
- ADRs relevantes: nenhum necessário

## Notas de Implementação

- **Decisões tomadas**:
  - Presets são locais — persistidos no banco MySQL local da aplicação, não sincronizados entre máquinas.
  - Tipos de papel são cadastráveis pelo usuário — sem lista hard-coded no código.
  - Sem validação de compatibilidade entre parâmetros (qualquer combinação é válida).
- **Camadas afetadas**:
  - Domain: `PrintPreset` entity, `PaperType` entity, repositories interfaces
  - Application: `CreatePrintPresetUseCase`, `ListPrintPresetsUseCase`, `CreatePaperTypeUseCase`
  - Infrastructure: Prisma models `PrintPreset`, `PaperType`
  - Frontend: formulário de configuração, select de papel, gerenciador de presets e papéis
- **Testes esperados**:
  - Unit: validação de campos (nome de preset, nome de papel não vazios)
  - Integration: CRUD de presets e tipos de papel no banco
  - E2E: fluxo cadastrar papel → criar preset → aplicar preset
- **Riscos**:
  - Deleção de papel em uso por presets — tratar com confirmação e cascade ou bloqueio
  - Preset pode ficar inválido se papel associado for deletado — detectar e avisar ao carregar
