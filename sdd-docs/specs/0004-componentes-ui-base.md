# Feature: Componentes UI Base Complementares

> Status: `implemented` · Autor: Antigravity · Data: 2026-04-27

## Contexto

Complementar a biblioteca de primitivas visuais do frontend ("Arquitetura Leve") construindo componentes essenciais (Table, Select, Checkbox, Card, Tabs) que ainda não foram implementados, focando em acessibilidade e CSS puro.

## Requisitos Funcionais

- [ ] RF1 — **Table**: Suporte a colunas dinâmicas, header fixo e paginação visual (sem lógica acoplada).
- [ ] RF2 — **Select**: Dropdown customizado ou estilização nativa focada em clareza, suportando `disabled` e estado de erro.
- [ ] RF3 — **Checkbox/Radio**: Elementos de formulário padronizados, com suporte a *indeterminate* (checkbox) e *focus-visible*.
- [ ] RF4 — **Card**: Container versátil com seções de cabeçalho, corpo e rodapé para exibir blocos de informação.
- [ ] RF5 — **Tabs**: Navegação em abas para alternar conteúdo na mesma visão de forma semântica.
- [ ] RF6 — **Textarea**: Campo de texto longo, com auto-resize opcional e suporte a *error states* (similar ao Input).
- [ ] RF7 — **Tooltip**: Componente acessível focado em exibir contexto adicional ao passar o mouse ou dar foco.

## Requisitos Não-Funcionais

- [ ] RNF1 — Todos os componentes devem utilizar **apenas CSS Modules**, sem bibliotecas pesadas externas (ex: MUI, Radix).
- [ ] RNF2 — Conformidade total com WCAG 2.1 AA (Acessibilidade): uso correto de tags ARIA, suporte completo a navegação por teclado e testes com `vitest-axe`.
- [ ] RNF3 — Alta performance: zero re-renderizações desnecessárias, componentes funcionais puros sempre que possível para rodar liso em PC com 4GB RAM.
- [ ] RNF4 — Suporte automático ao Dark Mode via variáveis CSS definidas na base do projeto (`index.css`).

## Critérios de Aceite

### Cenário 1: Navegação por Teclado em Tabs
- **Given** o componente Tabs renderizado com 3 abas
- **When** o usuário navega usando `Tab` e as setas direcionais
- **Then** o foco deve ser aprisionado e alternado de forma semântica (com uso de `role="tablist"` e `role="tab"`).

### Cenário 2: Exibição de Erro no Select
- **Given** um formulário inválido
- **When** o componente Select recebe a prop `error`
- **Then** as bordas devem ficar vermelhas e o `aria-invalid` deve ser setado como `true`.

### Cenário 3: Estrutura da Tabela Acessível
- **Given** uma tabela com dados
- **When** renderizada para leitura de tela
- **Then** deve ter `<caption>` descritivo, headers (`<th>`) amarrados às células e rolagem contida que não quebre o layout.

## API Contract

N/A - O desenvolvimento concentra-se apenas em componentes visuais frontend sem integração direta de rede em sua construção isolada.

## Dependências

- Specs relacionadas: 0003-estrutura-base-frontend.md (Base do UI System e Tokens)
- Pacotes/serviços externos: N/A (Apenas React, CSS Modules)
- ADRs relevantes: N/A

## Notas de Implementação

- Camadas afetadas: `frontend/src/components/ui`
- Testes esperados: Testes Unitários e Testes de Acessibilidade (Vitest + JSDOM + vitest-axe).
- Riscos: Criar componentes excessivamente complexos em vez de mantê-los "primitivos" e agnósticos à regra de negócio. O Table, por exemplo, não deve fazer fetch, apenas renderizar dados.
