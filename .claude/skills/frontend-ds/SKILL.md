---
name: frontend-ds
description: Enforça o Design System do Gráfica Manager em qualquer task de frontend. Invoque ANTES de criar ou modificar componentes, páginas ou estilos CSS. Garante uso correto de tokens, primitivos e padrões documentados em sdd-docs/design-system.md.
---

# frontend-ds

Este skill carrega o Design System e aplica suas regras à task em andamento.

## O que fazer ao ser invocado

1. Leia `sdd-docs/design-system.md` inteiro — ele é a fonte de verdade. Está alinhado com o `README.md`.
2. Identifique quais seções são relevantes para a task (tokens? componente específico? layout de página? performance?).
3. Aplique estritamente as regras. Se houver conflito entre código existente e o design system, **siga o design system**.
4. Ao escrever CSS Modules, adicione um comentário `/* DS: <token-name> */` nas primeiras utilizações de um token novo, para facilitar revisão.
5. Se a task criar uma página nova, **obrigatoriamente** use `React.lazy()` + `Suspense`.
6. Se a task envolver lista de dados, verifique se tem potencial de >100 itens — se sim, planeje virtualização.

## Checklist obrigatório antes de qualquer código

Responda mentalmente antes de escrever qualquer linha:

**Tokens (seção 2 do design system):**
- [ ] Qual token de cor? (2.1 — nunca hex/rgba direto)
- [ ] Qual token de espaçamento? (2.2 — `--space-N`, nunca `--spacing-*`)
- [ ] Qual token de tipografia? (2.3 — nunca `14px` ou `600` hardcoded)
- [ ] Qual token de border-radius? (2.4 — nunca `8px` direto)
- [ ] Qual token de sombra? (2.5 — nunca box-shadow literal)
- [ ] Qual token de z-index? (2.6 — nunca `1000` direto)

**Arquitetura (seção 3 do design system — alinhado com README):**
- [ ] Se é uma página nova: está usando `React.lazy()` + `Suspense`?
- [ ] Estado compartilhado: usando Context API? (sem Redux, Zustand, etc.)
- [ ] Fetch: está na camada `services/`? (nunca na página/componente)
- [ ] Lista de dados: tem potencial >100 itens? Se sim, planejar virtualização.
- [ ] Adicionando alguma lib nova? Verificou tamanho no bundlephobia?

**Primitivos (seção 4 do design system):**
- [ ] Usando `<Button>` em vez de `<button>`?
- [ ] Usando `<Input>` em vez de `<input>`?
- [ ] Usando `<Modal>` em vez de backdrop manual?
- [ ] Tratei loading, erro e estado vazio?
- [ ] Labels e aria-* estão presentes?

## Regras rígidas (nunca viole)

### CSS

```css
/* ❌ PROIBIDO */
padding: 16px;
font-size: 14px;
font-weight: 600;
color: #e02424;
box-shadow: 0 4px 16px rgba(0,0,0,0.15);
border-radius: 8px;
z-index: 1000;
--spacing-md: ...;   /* série deprecada */

/* ✅ CORRETO */
padding: var(--space-4);
font-size: var(--font-size-sm);
font-weight: var(--font-weight-semibold);
color: var(--color-danger);
box-shadow: var(--shadow-lg);
border-radius: var(--radius-md);
z-index: var(--z-modal);
```

### JSX

```tsx
/* ❌ PROIBIDO */
<button onClick={fn}>Salvar</button>
<input value={v} onChange={fn} />
<div style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>

/* ✅ CORRETO */
<Button variant="primary" onClick={fn}>Salvar</Button>
<Input label="Campo" value={v} onChange={fn} />
<Card>...</Card>
```

### Tokens inexistentes

Se uma variável CSS ainda **não existe** em `index.css` mas está listada na seção 9 do design system ("Tokens a Adicionar"), **adicione-a ao `index.css` primeiro** antes de usar no componente.

Se um token não está em nenhum lugar do design system, **pergunte ao usuário** se deve ser adicionado — nunca invente tokens sozinho.

## Padrão de CSS Module — template base

Copie e adapte:

```css
/* ComponentName.module.css */
/* Segue sdd-docs/design-system.md v1.0.0-draft */

.root {
  /* layout */
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
}

.errorBox {
  padding: var(--space-4);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-danger);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
```

## Padrão de Página — template base

```tsx
// XxxPage.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './XxxPage.module.css';

export function XxxPage() {
  // hook de dados
  // const { items, loading, error } = useXxx();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Título</h1>
        <Button variant="primary">Ação Principal</Button>
      </div>

      <Card>
        <CardContent>
          {loading && <div className={styles.loading}><Spinner size="lg" /></div>}
          {error && <div className={styles.errorBox} role="alert">{error}</div>}
          {!loading && !error && (
            /* conteúdo */
            null
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Importações de componentes UI (caminhos canônicos)

```tsx
import { Button }   from '@/components/ui/Button/Button';
import { Input }    from '@/components/ui/Input/Input';
import { Select }   from '@/components/ui/Select/Select';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card/Card';
import { Modal }    from '@/components/ui/Modal/Modal';
import { Badge }    from '@/components/ui/Badge/Badge';
import { Spinner }  from '@/components/ui/Spinner/Spinner';
import { Table }    from '@/components/ui/Table/Table';
import { useNotification } from '@/contexts/NotificationContext';
```

## O que fazer com código existente despadronizado

Se a task pede **modificar** um componente que viola o design system:
1. Corrija as violações no trecho que você está tocando.
2. Não faça refactor total do arquivo — apenas corrija o necessário para a task.
3. Anote no commit quais violações foram corrigidas.

Se a task pede **criar** algo do zero:
1. Siga 100% o design system desde o início.
2. Se um primitivo necessário não existe ainda, crie-o antes da página/componente (com `new-component`).

## Não faça

**Bibliotecas e CSS:**
- Não instale lib de UI (MUI, Chakra, Ant, Tailwind, Bootstrap, etc.).
- Não instale lib de animação (framer-motion, react-spring, etc.) — use CSS transitions.
- Não crie CSS-in-JS (emotion, styled-components, stitches).
- Não use `style={{ ... }}` em JSX exceto para valores genuinamente dinâmicos.
- Não declare tokens CSS em CSS Modules — apenas em `index.css`.

**Estado:**
- Não instale Redux, Zustand, Recoil, Jotai, MobX, React Query, SWR.
- Não faça fetch direto em componentes ou páginas — use services/.

**Performance:**
- Não crie página sem `React.lazy()`.
- Não itere lista com `.map()` sem considerar virtualização se >100 itens.
- Não use `setInterval` ou polling — prefira eventos IPC.
- Não carregue arquivo inteiro em memória — use streaming/chunking para PDFs/imagens.

**Integridade do design system:**
- Não crie tokens novos sem consultar o usuário.
- Não ignore o estado de loading/erro/vazio.
- Não remova `outline` de elementos focáveis sem substituto visível.
