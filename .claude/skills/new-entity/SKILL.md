---
name: new-entity
description: Scaffold de uma entidade de domínio do backend (packages/backend/src/domain/entities/) com value objects, errors de domínio e teste unitário. Use ao adicionar conceito de domínio novo (Order, Customer, Printer, PrintJob, etc.). Aplica regras de Clean Architecture — entity sem dependência externa.
---

# new-entity

Cria uma nova entidade de domínio com tudo que ela precisa.

## Pré-checagem

- Existe spec em `sdd-docs/specs/` que justifica esta entidade? Se não, pare e sugira `new-spec` antes.
- A entidade já existe? Se sim, pare.

## Arquivos a criar

```
packages/backend/src/domain/entities/<Name>.ts
packages/backend/src/domain/errors/<Name>Errors.ts        (se necessário)
packages/backend/src/domain/value-objects/<VO>.ts          (1 arquivo por VO)
packages/backend/tests/unit/domain/entities/<Name>.spec.ts
```

## Padrões obrigatórios

### Entity

- Classe com construtor `private` + factory `static create(props): Result<Name, DomainError>` ou similar.
- Props imutáveis (readonly). Mudanças retornam nova instância OU emitem evento de domínio.
- Identidade via `id` (string UUID). Equals comparando ids.
- **Zero imports** de: `express`, `@prisma/client`, `axios`, `fs`, qualquer infra. Só TS puro + outros arquivos de `domain/`.
- Validações no `create` lançam ou retornam erro de domínio — nunca `Error` genérico.

### Value Object

- Imutável, validação no construtor.
- `equals(other)` por valor.
- Sem identidade própria.

### Errors

- Classe estende `DomainError` (criar base em `domain/errors/DomainError.ts` se ainda não existe).
- `code` (UPPER_SNAKE_CASE) e `message` claros em português.

### Teste

- Cobrir: criação válida, cada validação que falha, métodos de comportamento, eventos emitidos (se houver).
- Vitest (`describe`/`it`/`expect`).
- Sem mocks — entidade não tem deps.

## Esqueleto de referência

```ts
// domain/entities/Order.ts
import { DomainError } from '../errors/DomainError';
import { OrderId } from '../value-objects/OrderId';

export class Order {
  private constructor(
    public readonly id: OrderId,
    public readonly status: OrderStatus,
    /* ... */
  ) {}

  static create(props: CreateOrderProps): Order {
    if (/* invalid */) throw new InvalidOrderError('motivo claro');
    return new Order(/* ... */);
  }

  markAsProduced(): Order {
    if (this.status !== 'received') throw new InvalidOrderTransitionError();
    return new Order(this.id, 'in_production', /* ... */);
  }
}
```

## Após criar

- Rodar `pnpm --filter backend test:unit` e mostrar resultado.
- Verificar com `arch-check` se não há violação de dependência.
- Sugerir próximo passo: `new-repository` para persistir, ou `new-use-case` para orquestrar.

## Não faça

- Não importe Prisma ou tipos gerados pelo Prisma na entity.
- Não exponha setters públicos de props mutáveis.
- Não coloque lógica de persistência aqui (pertence ao repository).
- Não use `any`.
