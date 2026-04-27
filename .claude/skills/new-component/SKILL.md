---
name: new-component
description: Scaffold de componente React (UI primitivo OU de domínio) com CSS Module, teste e barrel. Use ao criar Button/Input/Modal/Table/Select (ui/) ou OrderCard/PrintPreview (domain/). Componentes próprios — nunca instalar lib de UI.
---

# new-component

Cria um componente React seguindo as regras de leveza e a11y do CLAUDE.md.

## Pré-checagem

- Já existe componente similar? Se sim, pergunte se é melhor estender o existente.
- O componente é primitivo (Button, Input...) ou de domínio (OrderCard...)? Determina a pasta:
  - `packages/frontend/src/components/ui/<Name>/` para primitivos
  - `packages/frontend/src/components/domain/<Name>/` para domínio

## Arquivos a criar

```
<base>/<Name>/<Name>.tsx
<base>/<Name>/<Name>.module.css
<base>/<Name>/<Name>.spec.tsx
<base>/<Name>/index.ts            (barrel: re-exporta o componente)
```

## Padrões obrigatórios

### Componente

```tsx
// components/ui/Button/Button.tsx
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, ...rest }, ref) => (
    <button
      ref={ref}
      className={`${styles.root} ${styles[variant]} ${className ?? ''}`}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
```

### Acessibilidade (não negociável)

- Foco visível (CSS `:focus-visible` com outline claro).
- Suporte a teclado (Enter/Space para botões interativos custom, setas para listas/menus).
- `aria-*` apropriado quando o elemento nativo não cobre semântica.
- Labels associadas (`<label htmlFor>` ou `aria-label`/`aria-labelledby`).
- Cor não é o único meio de comunicar estado (ícone/texto também).

### CSS Module

- Sem CSS-in-JS runtime.
- Use CSS variables globais (definidas em `src/index.css`) para cores, spacing, fontes, raios.
- Classe `root` para o elemento raiz; modifiers como classes adicionais (`.primary`, `.disabled`).

```css
.root {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  cursor: pointer;
}
.root:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.primary { background: var(--color-primary); color: var(--color-on-primary); }
```

### Barrel

```ts
// index.ts
export { Button } from './Button';
```

### Teste

- Vitest + `@testing-library/react`.
- Cobrir: render com props default, cada variant, estado disabled, evento onClick, foco via teclado, atributos a11y.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

it('chama onClick ao pressionar Enter', async () => {
  const fn = vi.fn();
  render(<Button onClick={fn}>ok</Button>);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  expect(fn).toHaveBeenCalled();
});
```

### Lazy/perf

- Componentes de **domínio** que renderizam listas longas: usar virtualização própria (já implementada no projeto OU criar utilitária em `utils/virtualize.ts`). Não instale `react-window`/`react-virtual`.
- Não use `React.memo` profilaticamente — só onde profile mostra benefício.

## Após criar

- Rodar `pnpm --filter frontend test:unit`.
- Importar via barrel onde for usado: `import { Button } from '@/components/ui/Button'`.

## Não faça

- **Nunca** instale `@mui/*`, `antd`, `chakra-ui`, `react-bootstrap`, `tailwindcss`, `styled-components`, `@emotion/*`.
- Não use estilos inline para coisas que CSS Module resolve.
- Não use `any` em props.
- Não crie componente sem teste.
- Não duplique tokens — sempre referencie CSS variables.
