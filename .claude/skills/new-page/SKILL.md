---
name: new-page
description: Scaffold de página do frontend (packages/frontend/src/pages/) com lazy loading, CSS Module, registro no roteador e hook de serviço para a API. Use ao adicionar tela nova (Orders, Customers, Printers, Settings, etc.).
---

# new-page

Cria uma página lazy-loaded com tudo wired.

## Pré-checagem

- Existe spec da feature? Se não, sugira `new-spec`.
- Os componentes de UI/domínio que a página vai usar já existem? Se não, criar com `new-component` antes.
- Os endpoints que a página vai consumir existem? Se não, criar com `new-route`.

## Arquivos a criar/modificar

```
packages/frontend/src/pages/<Name>/<Name>Page.tsx
packages/frontend/src/pages/<Name>/<Name>Page.module.css
packages/frontend/src/pages/<Name>/<Name>Page.spec.tsx
packages/frontend/src/pages/<Name>/index.ts                  (re-export default)
packages/frontend/src/services/<resource>.service.ts          (criar OU adicionar função)
packages/frontend/src/hooks/use<Resource>.ts                  (hook que consome o service)
packages/frontend/src/App.tsx                                 (registrar rota com React.lazy)
```

## Padrões obrigatórios

### Página

```tsx
// pages/Orders/OrdersPage.tsx
import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from '@/components/domain/OrderCard';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  const { data, isLoading, error } = useOrders();

  if (isLoading) return <p>Carregando…</p>;
  if (error) return <p role="alert">Erro: {error.message}</p>;
  return (
    <main className={styles.root}>
      <h1>Pedidos</h1>
      <ul className={styles.list}>
        {data.map((o) => <li key={o.id}><OrderCard order={o} /></li>)}
      </ul>
    </main>
  );
}
```

- **Default export** para funcionar com `React.lazy()`.
- Estados de loading e erro tratados explicitamente — não assuma que dados existem.
- Listas longas (>100 itens potencial): usar utilitário próprio de virtualização.

### Service (camada exclusiva de fetch)

```ts
// services/orders.service.ts
import type { Order } from '@grafica/shared/types';

const API = '/api/orders';

export async function listOrders(): Promise<Order[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

- **Único** lugar que faz `fetch` para a API. Páginas/components consomem via hook.
- Tipos de domínio vêm de `@grafica/shared`.

### Hook

```ts
// hooks/useOrders.ts
import { useEffect, useState } from 'react';
import { listOrders } from '@/services/orders.service';

export function useOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOrders()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
```

- Cancelamento via flag para evitar setState após unmount.
- Sem React Query/SWR — Context API + hooks próprios é o suficiente para o alvo do CLAUDE.md.

### Roteador (lazy)

```tsx
// App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const OrdersPage = lazy(() => import('./pages/Orders'));

export function App() {
  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Routes>
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Suspense>
  );
}
```

- Toda página é `lazy` — regra do CLAUDE.md.
- `Suspense` no nível mais alto razoável.

### Teste

- Cobrir: render do estado de loading, render dos dados, render do erro.
- Mockar o service via `vi.mock('@/services/orders.service')`.
- Verificar atributos a11y (`role="alert"` no erro, `<h1>` na página, etc.).

## Após criar

- Rodar `pnpm --filter frontend test:unit`.
- Conferir que o tamanho do bundle da página continua razoável (não importou nada gigante).
- Validar a11y básica: TabIndex, foco inicial, contraste.

## Não faça

- Não pule `React.lazy` — toda página é lazy.
- Não faça `fetch` direto na página — sempre via service.
- Não importe libs de data fetching (React Query, SWR, RTK Query).
- Não use `any` em respostas da API — tipos vêm de `@grafica/shared`.
