---
name: new-spec
description: Cria uma nova spec de feature em sdd-docs/specs/ seguindo o template SDD obrigatório do projeto. Use SEMPRE antes de implementar qualquer feature nova — o fluxo SDD do CLAUDE.md exige spec antes de código. Numera automaticamente.
---

# new-spec

Cria `sdd-docs/specs/NNNN-<slug>.md` com o template de spec do projeto.

## Passos

1. Listar `sdd-docs/specs/` e encontrar o maior `NNNN` existente. Próximo número = +1, paddado a 4 dígitos (ex.: `0007`).
2. Pedir ao usuário (se não fornecido):
   - Nome da feature.
   - Slug curto (kebab-case) — derivar do nome se omitido.
   - Resumo de 1 linha do contexto.
3. Criar o arquivo com o template abaixo. **Não** preencha as seções de requisitos — deixe placeholders claros para o usuário completar.

## Template

```markdown
# Feature: <NOME DA FEATURE>

> Status: `draft` · Autor: <usuário> · Data: <YYYY-MM-DD>

## Contexto

<resumo de 1 linha — por que essa feature existe, qual problema resolve>

## Requisitos Funcionais

- [ ] RF1 —
- [ ] RF2 —

## Requisitos Não-Funcionais

- [ ] RNF1 — (performance, alvo 4GB RAM/dual-core)
- [ ] RNF2 — (segurança, validação)

## Critérios de Aceite

### Cenário 1: <nome>
- **Given** <estado inicial>
- **When** <ação>
- **Then** <resultado esperado>

## API Contract

<se a feature expõe HTTP, link para `sdd-docs/api/<arquivo>.yaml`. Caso contrário, "N/A">

## Dependências

- Specs relacionadas: <links>
- Pacotes/serviços externos: <listar>
- ADRs relevantes: <listar>

## Notas de Implementação

- Camadas afetadas: domain / application / infrastructure / frontend
- Testes esperados: <unit / integration / e2e>
- Riscos: <listar>
```

## Após criar

- Mostre o caminho do arquivo criado.
- Lembre o usuário do fluxo SDD: **spec → API contract → testes (Red) → código (Green) → refactor → ADR**.
- Se a feature expõe API, sugira criar também o arquivo OpenAPI em `sdd-docs/api/`.

## Não faça

- Não implemente código baseado na spec ainda — a spec precisa ser aprovada primeiro.
- Não invente requisitos. Use placeholders e peça ao usuário para preencher.
