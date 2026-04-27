---
name: new-use-case
description: Scaffold de um use case do backend (packages/backend/src/application/use-cases/) com DTO, validator Zod e teste unitário. Use ao adicionar uma operação de aplicação (CreateOrder, RegisterPrintJob, ImportShopeeOrder, etc.). Aplica SRP — um use case = uma operação.
---

# new-use-case

Cria um use case seguindo o padrão Clean Architecture do projeto.

## Pré-checagem

- Existe spec descrevendo a operação? Se não, sugira `new-spec`.
- As entidades e repositories envolvidos já existem? Se não, criar antes (`new-entity`, `new-repository`).

## Arquivos a criar

```
packages/backend/src/application/use-cases/<verb><Subject>.ts
packages/backend/src/application/dtos/<verb><Subject>.dto.ts
packages/backend/src/application/validators/<verb><Subject>.validator.ts
packages/backend/tests/unit/application/use-cases/<verb><Subject>.spec.ts
```

Convenção de nome: verbo + sujeito em PascalCase. Ex.: `CreateOrder`, `RegisterPrintJob`, `ImportShopeeOrder`.

## Padrões obrigatórios

### Use Case

```ts
// application/use-cases/CreateOrder.ts
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { CreateOrderInput, CreateOrderOutput } from '../dtos/CreateOrder.dto';
import { Order } from '@/domain/entities/Order';

export class CreateOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const order = Order.create(/* ... */);
    await this.orders.save(order);
    return { id: order.id.value };
  }
}
```

- Classe com construtor recebendo **interfaces** (de `domain/`) — nunca implementações concretas.
- Método único `execute(input): Promise<output>`.
- SRP rigoroso: se sente que precisa de dois métodos, são dois use cases.

### DTO

- Tipos `<Verb><Subject>Input` e `<Verb><Subject>Output` em `application/dtos/`.
- Tipos puros, sem dependência de framework.

### Validator (Zod)

```ts
// application/validators/CreateOrder.validator.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({/* ... */})).min(1),
});

export type CreateOrderInputRaw = z.infer<typeof createOrderSchema>;
```

O validator é chamado no controller **antes** do use case. Use case recebe input já validado.

### Teste

- Mockar repositórios (são interfaces — fácil mockar manualmente, não precisa de lib).
- Cobrir: caminho feliz, cada erro de domínio possível, comportamento de side-effects (events, notificações).
- Sem banco real — isso é teste unitário.

```ts
const mockRepo: OrderRepository = {
  save: vi.fn(),
  findById: vi.fn(),
};
const useCase = new CreateOrderUseCase(mockRepo);
```

## Após criar

- Rodar `pnpm --filter backend test:unit` e mostrar resultado.
- Sugerir `new-route` se a operação precisa ser exposta via HTTP.
- Lembrar: o use case ainda precisa ser **wired** no composition root (`infrastructure/config/`).

## Não faça

- Não chame Prisma direto — sempre via interface de repository.
- Não retorne entidades cruas no output — mapeie para DTO.
- Não coloque lógica de domínio aqui (pertence à entity).
- Não use `any` no input/output.
