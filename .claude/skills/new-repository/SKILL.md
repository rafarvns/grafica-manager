---
name: new-repository
description: Scaffold de repository — interface em domain/repositories e implementação Prisma em infrastructure/database, com teste de integração contra MySQL real. Use ao precisar persistir uma entidade nova ou expor uma nova query.
---

# new-repository

Cria a tripla **interface + implementação Prisma + teste de integração**.

## Pré-checagem

- A entidade existe em `domain/entities/`? Se não, criar primeiro com `new-entity`.
- O modelo Prisma já existe em `prisma/schema.prisma`? Se não, criar e rodar migration (ver "Schema" abaixo).

## Arquivos a criar

```
packages/backend/src/domain/repositories/<Name>Repository.ts
packages/backend/src/infrastructure/database/Prisma<Name>Repository.ts
packages/backend/src/infrastructure/database/mappers/<Name>Mapper.ts
packages/backend/tests/integration/database/Prisma<Name>Repository.spec.ts
```

## Padrões obrigatórios

### Interface (domain)

```ts
// domain/repositories/OrderRepository.ts
import type { Order } from '../entities/Order';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  // só os métodos necessários — não invente CRUD completo se não precisa
}
```

- **Zero imports** de Prisma aqui. Apenas tipos de `domain/`.
- Métodos retornam **entidades de domínio**, nunca tipos do Prisma.

### Implementação (infrastructure)

```ts
// infrastructure/database/PrismaOrderRepository.ts
import type { PrismaClient } from '@prisma/client';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from './mappers/OrderMapper';

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    const data = OrderMapper.toPersistence(order);
    await this.prisma.order.upsert({ where: { id: data.id }, create: data, update: data });
  }
  // ...
}
```

### Mapper

- Funções estáticas: `toDomain(raw): Entity` e `toPersistence(entity): PrismaInput`.
- **Único** lugar onde tipos de Prisma e entidades coexistem.

### Teste de integração

- **Banco real** (MySQL). Nunca SQLite/mock — viola regra do CLAUDE.md.
- Setup: cliente Prisma apontando para DB de teste (var de ambiente `DATABASE_URL_TEST`).
- `beforeEach`: limpar tabelas afetadas com `prisma.<model>.deleteMany()`.
- Cobrir: save (insert), save (update via upsert), findById (hit), findById (miss), queries específicas.

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_TEST } } });

beforeEach(async () => {
  await prisma.order.deleteMany();
});
```

## Schema Prisma (se ainda não existe)

1. Edite `packages/backend/prisma/schema.prisma`.
2. Rode `pnpm --filter backend prisma migrate dev --name add_<name>`.
3. Confirme que o cliente foi regerado.
4. **Nunca edite uma migration depois de mergeada na main.** Se erro, faça nova migration corretiva.

## Após criar

- Rodar `pnpm --filter backend test:integration` e mostrar resultado.
- Garantir que a interface foi usada por algum use case (ou está prevista — ok ficar não-wired temporariamente).
- Sugerir registro no composition root.

## Não faça

- Não exponha o `PrismaClient` via interface.
- Não vaze tipos de Prisma além do mapper.
- Não use SQLite em testes.
- Não coloque lógica de domínio no repository (sem `if (order.status === ...)` decidindo regra de negócio aqui).
