# Feature: Manual Duplex Wizard (frente e verso assistido em impressoras simplex)

> Status: `implemented` (MVP) · Autor: rafarvns · Data: 2026-05-05

## Contexto

Várias impressoras alvo (incluindo Epson L3250) não têm duplex automático. Hoje, ao detectar `supportsDuplex=false` (ADR/IPC já existente), o `PrintConfigPanel` força "Frente" desabilitando as opções de duplex. Operadores precisam imprimir manualmente em duas etapas, o que é técnico e error-prone.

Esta feature adiciona um **wizard guiado** que orquestra a impressão em 2 passagens (ímpares → vira folhas → pares) com instruções visuais para o usuário, eliminando a necessidade de conhecimento técnico.

## Requisitos Funcionais

- [x] **RF1** — Quando a impressora não suportar duplex automático, o `PrintConfigPanel` mostra "Frente e verso manual (longo)" e "Frente e verso manual (curto)" no select de Impressão (em vez das opções de hardware).
- [x] **RF2** — Quando o usuário escolher uma opção manual e clicar Imprimir, o app abre o **diálogo nativo de Preferências** (gate ADR 0005) via novo IPC `printer:show-preferences`. Cancel aborta sem impressão. OK abre o `<ManualDuplexWizard>` modal.
- [x] **RF3** — O wizard tem 5 passos: (1) confirmação com resumo; (2) imprimindo frente; (3) instruções de virada com ilustração SVG; (4) imprimindo verso; (5) sucesso.
- [x] **RF4** — Cada passagem do wizard chama o IPC `printer:print-pdf` com `pages` filtrado (ímpares na 1ª, pares na 2ª) e `skipPrinterDialog: true` (não reabre o dialog Win32 a cada passagem — gate já foi feito antes do wizard).
- [x] **RF5** — Documento com 1 página: wizard NÃO abre. Cai no fluxo simplex normal com toast informativo.
- [x] **RF6** — Documento com nº ímpar de páginas: wizard avisa explicitamente no resumo e no sucesso que a última folha ficará só com frente.
- [x] **RF7** — Cancelar no step de virada (após pass 1) mostra confirmação inline; se confirmado, registra POST `/print-jobs` com `status=cancelled, duplexMode=manual_long|short`.
- [x] **RF8** — Em caso de sucesso, registra POST `/print-jobs` com `duplexMode=manual_long|short` e `status=success`.
- [x] **RF9** — Após print bem-sucedido (manual ou hardware), o backend recebe `duplexMode` no payload (logado por enquanto, persistência deixada para próxima migration).

## Requisitos Não-Funcionais

- [x] **RNF1** — Ilustração SVG inline (sem dependências externas), responsiva, com diferenciação visual clara entre virada longa e curta.
- [x] **RNF2** — Lógica de paginação em funções puras testáveis (`computeManualDuplexPasses`, `formatPagesParam`) com 7 testes unitários cobrindo casos pares/ímpares/edge.
- [x] **RNF3** — Concorrência: como o IPC já passa pelo `printQueue` (serializa por printer name), as duas passagens nunca correm em paralelo com outras impressões para a mesma impressora.
- [x] **RNF4** — Quality entre passagens é mantida via cache DEVMODE (ADR 0006) — sem dialog gate em cada passagem.

## Critérios de Aceite

### Cenário 1: Detecção de impressora simplex
- **Given** o usuário seleciona uma impressora sem duplex automático (ex: Epson L3250)
- **When** o `PrintConfigPanel` carrega
- **Then** o select de "Impressão" mostra "Frente", "Frente e verso manual (longo)" e "Frente e verso manual (curto)" — sem as opções de hardware. Hint: "Será impresso em 2 passagens com instruções na tela".

### Cenário 2: Wizard de manual duplex (sucesso)
- **Given** usuário escolheu "Frente e verso manual (longo)", impressora L3250, PDF de 4 páginas
- **When** clica Imprimir
- **Then** abre o **diálogo nativo de Preferências** da Epson (gate ADR 0005) com prefill via cache DEVMODE se disponível
- **When** clica OK no diálogo
- **Then** abre `ManualDuplexWizard` no step 1 com resumo: "4 páginas, 2 folhas, primeiro frente (1, 3) depois verso (2, 4)"
- **When** clica Iniciar
- **Then** wizard imprime "1,3" silent (skipPrinterDialog=true, sem reabrir diálogo), avança para step 3 (virada)
- **When** usuário vira fisicamente e clica "Já recoloquei, imprimir verso"
- **Then** imprime "2,4" silent, avança para step 5 (sucesso)
- **When** clica Fechar
- **Then** wizard fecha, POST `/print-jobs` com `duplexMode=manual_long, status=success`, toast "Documento impresso frente e verso", `filePath` é limpo.

### Cenário 2b: Cancel no diálogo nativo antes do wizard
- **Given** usuário escolheu "Frente e verso manual (longo)" e clicou Imprimir
- **When** o diálogo nativo de Preferências abre e usuário clica **Cancelar**
- **Then** wizard NÃO abre, nada é impresso, **nenhum toast**, **nenhum POST `/print-jobs`**, botão Imprimir volta a ficar disponível.

### Cenário 3: Documento de 1 página
- **Given** PDF com 1 página, manual duplex selecionado
- **When** clica Imprimir
- **Then** wizard NÃO abre. Toast informativo "Documento de 1 página — usando frente única". Continua fluxo simplex normal (com dialog gate).

### Cenário 4: Documento de página ímpar (orphan)
- **Given** PDF com 5 páginas, manual duplex
- **When** wizard step 1 abre
- **Then** resumo mostra nota "ℹ️ Como o documento tem número ímpar de páginas, a última folha ficará só com frente impressa."
- **When** chega no step 5 (sucesso)
- **Then** mostra a mesma nota com a página específica: "A última página (página 5) ficou só com frente impressa, pois o documento tem número ímpar de páginas."

### Cenário 5: Cancelar após primeira passagem
- **Given** wizard está no step 3 (virada) — frente já impressa
- **When** clica Cancelar
- **Then** mostra confirm inline: "A frente já foi impressa. Cancelar agora deixará o documento incompleto. Tem certeza?"
- **When** clica "Sim, cancelar"
- **Then** wizard fecha, POST `/print-jobs` com `status=cancelled, duplexMode=manual_long, errorMessage="Cancelado após primeira passagem"`, toast "Impressão cancelada — apenas a frente foi impressa".

### Cenário 6: Erro durante uma passagem
- **Given** wizard está imprimindo frente (step 2)
- **When** o IPC retorna `{status:'error', error:'Out of paper'}`
- **Then** wizard avança para step de erro com mensagem visível, botão "Tentar novamente" volta para step 3 (virada) — usuário pode reabastecer e retomar.

### Cenário 7: Toggle entre hardware e manual baseado em capabilities
- **Given** usuário tinha selecionado "Frente e verso (longo)" (hardware) na impressora HP
- **When** troca para impressora L3250 (sem hardware duplex)
- **Then** seleção é trocada automaticamente para "Frente e verso manual (longo)" — o useEffect que reage a `capabilities.supportsDuplex` faz o swap.

## API Contract

Sem mudança no contrato HTTP. POST `/print-jobs` aceita campo opcional `duplexMode: string` no body — valores: `simplex | hardware_long | hardware_short | manual_long | manual_short`. Por enquanto apenas logado no servidor (sem persistência); migration futura adicionará coluna dedicada.

Mudança no contrato IPC interno:
- `PrintOptions` adiciona campo opcional `skipPrinterDialog?: boolean` — quando `true`, `printer:print-pdf` pula o `showPrinterPreferences` (gate Win32) e imprime silent direto.

## Dependências

- ADR 0006 (capture-replay) — quality persiste entre as duas passagens via cache DEVMODE.
- ADR 0005 (gate via DocumentProperties) — flag `skipPrinterDialog` é o opt-out documentado desse gate.
- IPC `printer:get-capabilities` (já existente) — define se a impressora suporta hardware duplex.

## Notas de Implementação

- **Ordem das pares hardcoded normal** no MVP. Funciona para inkjets face-up (L3250). Calibração por impressora deferida para v2.
- **`duplexMode` não persiste no banco** — só logado. Migration de coluna dedicada em spec separada.
- **Gate Win32 antes do wizard:** o diálogo nativo de Preferências aparece UMA vez antes do wizard abrir. As duas passagens dentro do wizard usam `skipPrinterDialog: true` (não reabrem o diálogo). O `SetPrinter` level 9 dentro de `showPrinterPreferences` no caso de OK persiste o DEVMODE escolhido como default da impressora — as passagens silenciosas usam esse default automaticamente.

### Verificação manual E2E

1. `pnpm electron:dev`. Selecionar impressora L3250.
2. Painel mostra "Frente e verso manual (longo/curto)" no select. Selecionar longo.
3. Selecionar pedido + PDF de 4 páginas. Clicar Imprimir.
4. **Diálogo nativo de Preferências da Epson abre** (gate ADR 0005, com prefill via cache DEVMODE).
   - Cancelar aqui → wizard NÃO abre, nada é impresso.
   - Clicar OK → segue ao próximo passo.
5. Wizard abre no step 1. Resumo: "4 páginas, 2 folhas, primeiro frente (1, 3) depois verso (2, 4)". Clicar Iniciar.
6. Pass 1 imprime sem reabrir dialog. Wizard avança para step 3.
7. Tirar as 2 folhas da bandeja de saída, virar pelo lado longo (como livro), recolocar na bandeja de entrada com frente impressa para baixo.
8. Clicar "Já recoloquei, imprimir verso". Pass 2 imprime sem reabrir dialog.
9. Step 5 mostra ✅. Verificar fisicamente: folhas têm 1/2 e 3/4 alinhados.
9. Repetir com PDF de 5 páginas → wizard avisa orphan no step 1 e step 5; verificar que pág 5 ficou só com frente.
10. Repetir com curto → ilustração diferente, output adequado para encadernação tipo bloco.
11. Cancel test: na step 3, clicar Cancelar → confirm inline → "Sim, cancelar" → toast "apenas a frente foi impressa".
12. Trocar para impressora HP (com hw duplex) → select volta a mostrar "Frente e verso (longo/curto)" sem "manual"; seleção atual é trocada automaticamente.

## Trabalho futuro (fora do escopo do MVP)

- **Calibração de ordem das pares por impressora.** Toggle "Inverter ordem das páginas pares" nas configurações da impressora; testes mostram que lasers face-down precisam de reverse. Persistência local ou backend.
- **Migration para coluna `duplex_mode` em `print_jobs`** — habilitar dashboards/relatórios filtrando por modo de duplex.
- **Botão "Imprimir folha de teste"** no PrintConfigPanel — gera 4 páginas com numeração grande, executa o wizard, pergunta no final "está alinhado?". Se não → flip strategy e salva.
- **Histórico de manual duplex parciais** — alertar no dashboard de impressões com filtro por `partial=true`.
