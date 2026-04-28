# Feature: PDF Document Preview

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Permitir que usuários visualizem documentos PDF antes de enviar para impressão, verificando layout, página, qualidade e conteúdo.

## Requisitos Funcionais

- [ ] RF1 — Abrir preview de PDF no modal dentro da aplicação
- [ ] RF2 — Navegar entre páginas (anterior, próxima, ir para página N)
- [ ] RF3 — Aplicar zoom (in, out, fit-width, fit-page)
- [ ] RF4 — Exibir informações da página (página atual / total de páginas)
- [ ] RF5 — Abrir PDF a partir de arquivo local no sistema de arquivos (via Electron dialog)
- [ ] RF6 — Quando PDF chegar via webhook, exibir botão para o usuário localizar o arquivo no sistema local
- [ ] RF7 — Quando servidor de arquivos de clientes for implementado (spec futura), salvar e servir o PDF a partir dele também

## Requisitos Não-Funcionais

- [ ] RNF1 — Carregamento progressivo de PDF (streaming/chunking via pdf.js, jamais carregar inteiro em memória)
- [ ] RNF2 — Render fluido sem travar UI (target: 4GB RAM / dual-core)
- [ ] RNF3 — Suportar PDFs grandes (>50MB) sem degradação perceptível
- [ ] RNF4 — Liberar recursos de canvas ao fechar o modal (evitar memory leak)

## Critérios de Aceite

### Cenário 1: Abrir preview de um PDF válido
- **Given** um documento PDF válido selecionado no sistema de arquivos
- **When** usuário clica em "Preview"
- **Then** modal abre com primeira página do PDF renderizada via pdf.js

### Cenário 2: Navegar entre páginas
- **Given** preview aberto em página 1 de um PDF com 5 páginas
- **When** usuário clica em "Próxima"
- **Then** página 2 é exibida e contador mostra "2/5"

### Cenário 3: Fechar preview
- **Given** preview aberto
- **When** usuário clica em fechar ou pressiona ESC
- **Then** modal fecha, recursos do canvas são liberados, retorna ao fluxo anterior

### Cenário 4: PDF chegou via webhook (sem arquivo local)
- **Given** pedido importado via webhook com referência de PDF mas sem arquivo local
- **When** usuário acessa o pedido e tenta visualizar o documento
- **Then** sistema exibe botão "Localizar arquivo" para o usuário selecionar o PDF manualmente

## API Contract

N/A — Feature é puramente frontend (Electron renderer). PDF é lido localmente via Node.js / Electron.

## Dependências

- Specs relacionadas: [0003-estrutura-base-frontend.md](0003-estrutura-base-frontend.md), [0005-integracao-impressoras.md](0005-integracao-impressoras.md), [0010-manual-order-crud.md](0010-manual-order-crud.md)
- Pacotes/serviços externos: `pdfjs-dist` (pdf.js — biblioteca oficial Mozilla para render de PDF em browser/Electron)
- ADRs relevantes: ADR a criar documentando escolha do pdf.js

## Notas de Implementação

- **Decisões tomadas**:
  - Biblioteca: `pdfjs-dist` (pdf.js). Bundle size verificar antes — usar apenas worker necessário.
  - Operações 100% locais. PDF lido diretamente do disco via Electron, sem upload para servidor.
  - Futuro: quando servidor de arquivos for implementado, o serviço de preview usará URL servida pelo backend.
- **Camadas afetadas**: frontend apenas (components, hooks)
  - `components/ui/PdfPreviewModal` — modal com render
  - `hooks/usePdfPreview` — carregamento, navegação, zoom
- **Testes esperados**:
  - Unit: hooks de carregamento/navegação de PDF (mock do pdf.js worker)
  - E2E: fluxo completo de seleção → preview → navegação → fechamento → verificar sem memory leak
- **Riscos**:
  - `pdfjs-dist` tem tamanho relevante — verificar bundlephobia e usar dynamic import (lazy)
  - PDFs com encoding especial ou proteção podem não renderizar corretamente
  - Worker do pdf.js precisa ser configurado corretamente no Electron (path do worker)
