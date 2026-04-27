---
name: new-adr
description: Cria um novo Architecture Decision Record em sdd-docs/decisions/. Use ao tomar decisão arquitetural relevante (escolher lib, pattern, mudar estrutura, abrir exceção a regra do CLAUDE.md). Numera automaticamente.
---

# new-adr

Cria `sdd-docs/decisions/NNNN-<titulo>.md` documentando uma decisão arquitetural.

## Quando criar uma ADR

- Adicionar uma dependência fora da stack obrigatória do CLAUDE.md.
- Escolher entre alternativas equivalentes (ex.: cuid2 vs uuid).
- Mudar uma estrutura de pasta acordada.
- Abrir exceção a uma regra (registre o porquê).
- Decidir um pattern em ponto crítico (Strategy vs Factory, etc.).

Trivialidades **não** viram ADR (nomear variável, ajustar log).

## Passos

1. Listar `sdd-docs/decisions/` e encontrar o maior `NNNN`. Próximo = +1 (4 dígitos).
2. Pedir ao usuário (se não fornecido):
   - Título curto (kebab-case) — vira parte do filename.
   - Status (`proposed` por padrão).
   - Contexto: o problema/situação.
   - Decisão: a escolha tomada.
3. Criar com o template abaixo.

## Template

```markdown
# ADR NNNN: <título>

- **Status**: proposed | accepted | deprecated | superseded by ADR-XXXX
- **Data**: YYYY-MM-DD
- **Autor**: <usuário>

## Contexto

<o problema, as forças em jogo, alternativas consideradas. Seja específico — referencie specs, requisitos, ou restrições do CLAUDE.md>

## Decisão

<a escolha tomada, em uma frase clara. Depois explique brevemente>

## Alternativas consideradas

- **<alternativa 1>**: <prós/contras, motivo de não escolher>
- **<alternativa 2>**: <prós/contras>

## Consequências

### Positivas
-

### Negativas / trade-offs
-

### Neutras
-

## Referências

- Specs: <links>
- ADRs relacionadas: <links>
- Issues / PRs: <links>
```

## Após criar

- Mostrar o caminho.
- Se a ADR muda uma regra do CLAUDE.md, **alertar o usuário** que o CLAUDE.md também deve ser atualizado para refletir a nova regra.
- Se a ADR é `accepted`, sugerir commit dedicado (`docs: add ADR-NNNN <título>`).

## Não faça

- Não escreva ADR retroativa sem confirmar com o usuário (decisões antigas raramente precisam ser ADR'd).
- Não use ADR para registrar bugs ou tarefas — isso é spec ou issue.
