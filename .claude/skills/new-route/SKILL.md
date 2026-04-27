---
name: new-route
description: Scaffold de uma rota HTTP — controller magro, route binding e middleware de validação Zod, plus teste de integração HTTP. Use ao expor um use case via API REST. Controller só extrai/formata; lógica fica no use case.
---

# new-route

Adiciona um endpoint HTTP wired ao Express, chamando um use case existente.

## Pré-checagem

- O use case correspondente já existe em `application/use-cases/`? Se não, criar com `new-use-case`.
- O contrato OpenAPI está em `sdd-docs/api/`? Se não, sugira ao usuário criar antes.

## Arquivos a criar/modificar

```
packages/backend/src/infrastructure/http/controllers/<resource>.controller.ts
packages/backend/src/infrastructure/http/routes/<resource>.routes.ts        (criar OU adicionar handler)
packages/backend/src/infrastructure/http/middlewares/validate.ts             (criar se não existe — middleware genérico Zod)
packages/backend/src/infrastructure/http/app.ts                              (registrar router)
packages/backend/tests/integration/http/<resource>.spec.ts
```

## Padrões obrigatórios

### Controller (magro)

```ts
// http/controllers/orders.controller.ts
import type { Request, Response } from 'express';
import type { CreateOrderUseCase } from '@/application/use-cases/CreateOrder';

export class OrdersController {
  constructor(private readonly createOrder: CreateOrderUseCase) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.createOrder.execute(req.body); // já validado pelo middleware
    res.status(201).json(result);
  };
}
```

- **Apenas** extrai dados, chama use case, formata response. Nada mais.
- Sem `try/catch` aqui — error handler global trata erros de domínio (mapeia para HTTP status).

### Route binding

```ts
// http/routes/orders.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { createOrderSchema } from '@/application/validators/CreateOrder.validator';

export function ordersRoutes(controller: OrdersController): Router {
  const r = Router();
  r.post('/', validate(createOrderSchema), controller.create);
  return r;
}
```

### Middleware de validação

Genérico, recebe schema Zod, valida `req.body` (ou `req.query`/`req.params` conforme parâmetro), responde 400 com erros formatados se falhar.

### Error handler global

Mapeia erros de domínio → HTTP status:
- `ValidationError` → 400
- `NotFoundError` → 404
- `ConflictError` → 409
- `UnauthorizedError` → 401
- `ForbiddenError` → 403
- Erro genérico → 500 (logar, não vazar stack ao cliente)

Criar em `infrastructure/http/middlewares/errorHandler.ts` se ainda não existe.

### Teste de integração HTTP

- Use `supertest` contra a app Express (sem subir servidor real).
- Mock dos repositories OU use banco de teste (preferir banco real para fluxo end-to-end da rota).
- Cobrir: 201/200 caminho feliz, 400 validação falhando, 404 recurso ausente, 409 conflito, formato JSON da resposta.

## Após criar

- Rodar `pnpm --filter backend test:integration`.
- Atualizar `sdd-docs/api/<resource>.yaml` (OpenAPI) se ainda não estiver.
- Verificar que o controller está wired no composition root e o router montado em `app.use('/api/<resource>', ...)`.

## Não faça

- Não coloque lógica de domínio no controller.
- Não use `try/catch` no controller — deixe propagar para o error handler.
- Não acesse `prisma` direto do controller (passa por use case → repository).
- Não crie endpoints sem validator Zod, mesmo que pareça "óbvio".
