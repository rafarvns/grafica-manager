# Feature: Remoção do Botão de Alternância de Tema

> Status: `draft` · Autor: rafarvns · Data: 2026-04-29

## Contexto

O sistema possui um botão de alternância entre tema claro e escuro no Header. O tema escuro não será mais suportado — o tema claro é o padrão e único tema do sistema. O botão, toda lógica de tema e o estado associado devem ser removidos para simplificar o código.

## Requisitos Funcionais

- [ ] RF1 — Remover o botão de alternância de tema (claro/escuro) do Header.
- [ ] RF2 — Remover toda lógica de controle de tema do `AppContext` (estado `theme`, função `toggleTheme`, persistência em `localStorage`).
- [ ] RF3 — Remover a aplicação do atributo `data-theme` (ou classe CSS equivalente) no elemento raiz do DOM.
- [ ] RF4 — Garantir que o sistema use exclusivamente o tema claro, sem nenhuma variável CSS de tema escuro ativa.
- [ ] RF5 — Remover quaisquer CSS variables, classes ou seletores relacionados ao tema escuro dos arquivos de estilo.

## Requisitos Não-Funcionais

- [ ] RNF1 — A remoção não deve afetar performance (apenas simplifica, sem overhead).
- [ ] RNF2 — Nenhuma regressão visual nas demais telas após a remoção do CSS de tema escuro.

## Critérios de Aceite

### Cenário 1: Header sem botão de tema
- **Given** o usuário abre o sistema
- **When** visualiza o Header
- **Then** não há botão de alternância de tema

### Cenário 2: Tema claro sempre ativo
- **Given** o sistema carregado em qualquer rota
- **When** inspeciona o elemento raiz
- **Then** não há atributo `data-theme="dark"` nem classe de tema escuro aplicada

### Cenário 3: Sem referências a tema no contexto
- **Given** componentes que usavam `AppContext` para ler `theme` ou `toggleTheme`
- **When** o contexto é consultado
- **Then** `theme` e `toggleTheme` não existem mais na interface do contexto

## API Contract

N/A

## Dependências

- Specs relacionadas: `0003-estrutura-base-frontend.md`, `0017-main-layout-navigation.md`
- Pacotes/serviços externos: nenhum
- ADRs relevantes: nenhum

## Notas de Implementação

- Camadas afetadas: frontend (Header, AppContext, CSS tokens/variables)
- Arquivos prováveis:
  - `src/layout/Header.tsx` — remover botão e importação de ícone de tema
  - `src/contexts/AppContext.tsx` — remover `theme`, `toggleTheme`, `localStorage` de tema
  - `src/layout/AppLayout.module.css` ou arquivo de tokens CSS — remover variáveis de tema escuro
  - `tests/unit/contexts/AppContext.spec.tsx` — atualizar testes que verificavam toggle de tema
  - `tests/unit/layout/AppLayout.spec.tsx` — remover asserção sobre botão "alternar tema"
- Testes esperados: unit (AppContext, Header, AppLayout)
- Riscos: verificar se algum componente lê `theme` do contexto diretamente para aplicar estilos inline; se sim, remover também.
