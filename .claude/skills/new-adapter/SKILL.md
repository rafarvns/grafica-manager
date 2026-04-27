---
name: new-adapter
description: Scaffold de adapter para integração externa (Shopee, Mercado Livre, impressora, storage). Cria interface em domain, implementação concreta em infrastructure/adapters, e validação de assinatura HMAC para webhooks. Aplica Strategy/Adapter pattern.
---

# new-adapter

Adiciona uma integração externa atrás de uma interface de domínio.

## Quando usar

- Nova integração de e-commerce (Shopee, Mercado Livre, etc.).
- Nova impressora ou método de envio para impressão.
- Storage externo (S3, disco local).
- Qualquer fonte de dados externa.

## Pré-checagem

- Existe spec descrevendo a integração? Se não, sugira `new-spec`.
- Existe ADR para a escolha do provedor (se houver alternativas)? Se não, sugira `new-adr`.

## Estrutura

### Interface (domain)

Define o **contrato** que o restante do sistema usa, em termos do domínio — não em termos do provedor.

```ts
// domain/services/EcommerceOrderProvider.ts
import type { ExternalOrder } from '../value-objects/ExternalOrder';

export interface EcommerceOrderProvider {
  readonly providerName: string;
  fetchOrder(externalId: string): Promise<ExternalOrder>;
  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): boolean;
  parseWebhookPayload(payload: unknown): ExternalOrder;
}
```

### Implementação (infrastructure)

Uma pasta por provedor.

```
infrastructure/adapters/<provider>/
├── <Provider>Adapter.ts            (implementa a interface)
├── <Provider>Client.ts             (HTTP client, baixo nível)
├── <Provider>SignatureVerifier.ts  (HMAC validation)
├── <Provider>OrderMapper.ts        (payload externo → ExternalOrder de domínio)
└── types.ts                        (tipos crus do provedor)
```

### Webhook signature (obrigatório)

Para qualquer adapter que receba webhook:

```ts
// infrastructure/adapters/shopee/ShopeeSignatureVerifier.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export class ShopeeSignatureVerifier {
  constructor(private readonly secret: string) {}

  verify(rawBody: Buffer, signatureHeader: string): boolean {
    const expected = createHmac('sha256', this.secret).update(rawBody).digest('hex');
    const received = Buffer.from(signatureHeader, 'hex');
    if (received.length !== Buffer.from(expected, 'hex').length) return false;
    return timingSafeEqual(Buffer.from(expected, 'hex'), received);
  }
}
```

- **Sempre** `timingSafeEqual`. Comparação `===` é vulnerável a timing attack.
- Use o **rawBody**, não o JSON parseado — qualquer reformat invalida a assinatura. Configure middleware Express para preservar `rawBody` apenas na rota de webhook.

### Tokens / segredos

- `.env` (e `.env.example` documentando). Nunca em código.
- Wire dos segredos só no composition root (`infrastructure/config/`).

### Testes

- Unit: `Mapper`, `SignatureVerifier` (com fixtures de payload real anonimizados em `tests/fixtures/<provider>/`).
- Integration: o adapter completo contra um mock de servidor HTTP (use `msw` ou `nock`) — não bata na API real.
- Cobrir: payload válido, assinatura inválida (deve rejeitar), payload malformado, timeout, erro 5xx do provedor.

## Strategy registry

Adapters de e-commerce são intercambiáveis via Strategy. Mantenha um registry:

```ts
// infrastructure/adapters/ecommerce/registry.ts
const providers = new Map<string, EcommerceOrderProvider>();
export function registerProvider(p: EcommerceOrderProvider) { providers.set(p.providerName, p); }
export function getProvider(name: string): EcommerceOrderProvider | undefined { return providers.get(name); }
```

Wire no composition root.

## Após criar

- Rodar `pnpm --filter backend test`.
- Atualizar `.env.example` com as variáveis novas.
- Documentar o provedor em uma ADR se foi escolha não óbvia.

## Não faça

- Nunca confie em payload externo — sempre valide assinatura E shape (Zod).
- Não exponha tipos do provedor além do adapter — mapeie para tipos de domínio.
- Não faça retry agressivo em webhooks recebidos (idempotência é obrigatório, mas o caller já reenvia).
- Não ignore timeout — todo cliente HTTP externo precisa de timeout (default 10s).
