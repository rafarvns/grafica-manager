# Feature: Correção da Qualidade de Impressão Aplicada à Impressora Física

> Status: `implemented` · Autor: rafarvns · Data: 2026-05-05 (atualizado)

## Contexto

O `<select>` de qualidade no `PrintConfigPanel` ("rascunho" / "normal" / "alta") **não altera** a saída física da impressora — usuários relataram que o mesmo PDF impresso em "rascunho" e "alta" sai idêntico. Investigação identificou três falhas em camadas diferentes:

1. O payload IPC enviado em `PrintPage.tsx` para `window.electronAPI.printPdf(filePath, options)` **omitia `quality`**. A informação era enviada apenas ao backend (POST `/print-jobs`) para registro de custo.
2. A interface `PrintOptions` (`packages/frontend/src/types/printer.ts`) não declarava `quality`/`dpi`.
3. O tipo `PrintQuality` é divergente em três pontos (`shared/constants` enum, `shared/types/settings` literal PT-BR, `PrintConfigPanel` literal PT-BR diferente).

Mesmo que o payload chegasse ao Electron main, a lib `pdf-to-printer` (que envolve `SumatraPDF.exe -print-settings`) não aceita `dpi` nem `quality` — a renderização depende do DEVMODE do driver Windows. A correção exige (a) propagação correta da informação e (b) uma estratégia para aplicá-la na impressora física.

> **Atualização (2026-05-05):** A primeira tentativa via `Set-PrintConfiguration -PrintQuality` (PowerShell antes do print) gerou warning persistente para drivers Epson (L3250 e similares) que ignoram a propriedade padrão. A segunda tentativa, via DocumentProperties com `DM_IN_BUFFER` no DEVMODE público (ADR 0005), também não funciona para quality em drivers Epson — eles armazenam quality na extensão privada (`dmDriverExtra`). A estratégia atual é capture-replay (ADR 0006).

## Decisão atual

O usuário tem **controle direto** via diálogo nativo de Preferências de Impressão, que é exibido como **gate** antes do print silencioso (ADR 0005). Para o **prefill de quality**, o app usa estratégia **capture-replay** (ADR 0006): o blob DEVMODE inteiro é salvo no disco após cada OK no diálogo, indexado por `(impressora, versão do driver, qualidade)`, e replicado via `SetPrinter` level 9 antes do diálogo nas próximas impressões. Trade-off: primeira impressão de cada qualidade abre sem prefill (graceful degradation); demais funcionam imediatamente. Demais campos (orientation/copies/color/duplex) seguem via DEVMODE público + `DM_IN_BUFFER` (esses sim, respeitados pelos drivers).

## Requisitos Funcionais

- [x] RF1 — `PrintOptions` aceita campo `quality?: PrintQualityLevel` e propaga do renderer ao main process via IPC.
- [x] RF2 — Antes da impressão, o main process abre o diálogo nativo de Preferências de Impressão (`DocumentProperties` com `DM_IN_PROMPT | DM_OUT_BUFFER`). **Nada é alterado na impressora antes do OK** do usuário.
- [x] RF3 — Se o usuário clicar **OK** no diálogo, o DEVMODE modificado é persistido como default da impressora via `SetPrinter` level 9, e o print silencioso é executado em seguida.
- [x] RF4 — Se o usuário clicar **Cancelar**, a impressão é abortada — sem print, sem registro no backend, sem notificação de erro.
- [x] RF5 — O retorno do IPC `printer:print-pdf` é um discriminador: `{status:'success'} | {status:'cancelled'} | {status:'error', error:string}`.
- [x] RF6 — Tipo `PrintQuality` consolidado (será tratado em ADR 0003 separado).
- [x] RF7 — Backend `POST /print-jobs` aceita o valor `quality` enviado pelo frontend (mantido como está; consolidação em ADR 0003 separada).

## Requisitos Não-Funcionais

- [x] RNF1 — (concorrência) Jobs simultâneos para a mesma impressora são serializados via `Map<printerName, Promise>` em `electron/services/printQueue.ts` — previne corrida no DEVMODE compartilhado quando dois usuários disparam jobs concorrentes.
- [x] RNF2 — (segurança) `printerName` é sanitizado antes de ir ao PowerShell (whitelist `[A-Za-z0-9 _\-().,#]+`) para evitar command injection.
- [x] RNF3 — (timeout) O diálogo de Preferências fica aberto por até 5 minutos; depois disso, o processo PS é morto e a impressão é tratada como cancelada.
- [x] RNF4 — (resiliência) Se o usuário não tem `PRINTER_ACCESS_ADMINISTER` na impressora (ex: impressora de rede compartilhada por outro host), o app abre o diálogo em modo somente-leitura (`PRINTER_ACCESS_USE`) — o diálogo ainda funciona como gate OK/Cancel, mas alterações não persistem.

## Critérios de Aceite

### Cenário 1: Quality propagada no IPC
- **Given** o usuário escolheu quality = "rascunho" no `PrintConfigPanel` e clicou em imprimir
- **When** `executePrint` é chamado
- **Then** o objeto enviado a `window.electronAPI.printPdf` contém `quality: 'rascunho'`

### Cenário 2A: Primeira impressão de uma qualidade (sem cache)
- **Given** o usuário escolheu quality = "rascunho" e nunca imprimiu rascunho nessa impressora antes
- **When** o usuário clica em imprimir
- **Then** o diálogo abre com o saved default da impressora (sem prefill de quality), demais campos pré-preenchidos. Após o usuário configurar Rascunho e clicar OK, o blob DEVMODE pós-dialog é salvo em `userData/printer-presets/{printer}__{driverHash}__rascunho.devmode`.

### Cenário 2B: Impressão subsequente da mesma qualidade (com cache)
- **Given** existe blob cached para (impressora, qualidade) com versão do driver compatível
- **When** o usuário clica em imprimir
- **Then** antes de abrir o diálogo, o blob é aplicado via `SetPrinter` level 9 → o diálogo abre lendo o novo default → mostra a qualidade correta. Após OK, novo blob substitui o anterior (caso o usuário tenha alterado algo no diálogo).

### Cenário 2C: Diálogo confirmado → print prossegue
- **Given** o usuário tem permissão administrativa na impressora
- **When** o usuário clica em imprimir e confirma o diálogo de Preferências
- **Then** o DEVMODE escolhido vira o default da impressora, o blob é capturado para o cache, e o `pdf-to-printer.print` silencioso é executado

### Cenário 3: Diálogo cancelado → print abortado e rollback do default
- **Given** o usuário tem o PDF e a impressora configurados (com pre-stage de cache, se aplicável)
- **When** o usuário clica em imprimir mas clica **Cancelar** no diálogo de Preferências
- **Then** o IPC retorna `{status:'cancelled'}`, **não há POST `/print-jobs`**, a UI não mostra notificação, e se houve pre-stage do default, é feito rollback via `SetPrinter` level 9 com o snapshot original.

### Cenário 4: Jobs concorrentes na mesma impressora
- **Given** dois jobs são disparados quase simultaneamente para a impressora "HP-LaserJet"
- **When** ambos passam pela fila
- **Then** o segundo só inicia (abrindo o diálogo) quando o primeiro termina o print silencioso — evitando dois diálogos sobrepostos para a mesma impressora

### Cenário 5: Driver/permissão restrita
- **Given** a impressora é de rede e o usuário não tem `PRINTER_ACCESS_ADMINISTER`
- **When** o usuário imprime
- **Then** o diálogo abre em modo USE-only; OK ainda completa o print (com defaults atuais), Cancel aborta

## API Contract

Sem mudança no contrato HTTP. `POST /print-jobs` continua aceitando `quality` no formato atual; consolidação para enum DRAFT/NORMAL/HIGH é tratada na ADR 0003 separadamente.

Mudança no contrato IPC interno (Electron):
- `printer:print-pdf` agora retorna `Promise<PrintJobResult>` (era `Promise<boolean>`).
- Canal `printer:quality-warning` **removido** — não há mais warning broadcast.

## Dependências

- Specs relacionadas: [0005-integracao-impressoras.md](0005-integracao-impressoras.md), [0007-print-parameters-configuration.md](0007-print-parameters-configuration.md), [0008-print-recording-accounting.md](0008-print-recording-accounting.md)
- Pacotes/serviços externos: PowerShell + C# inline (built-in Windows), `winspool.drv` (Win32 print API), `pdf-to-printer` (já instalado)
- ADRs relevantes:
  - [0003: Padronização PrintQuality enum](../decisions/0003-padronizacao-print-quality-enum.md)
  - [0004: ~~Aplicação via DEVMODE PowerShell~~](../decisions/0004-aplicacao-qualidade-via-devmode-powershell.md) (Superseded por 0005)
  - [0005: Preferências como gate via DocumentProperties](../decisions/0005-print-preferences-gate-via-documentproperties.md) (revisado parcialmente por 0006)
  - [0006: Capture-replay de DEVMODE para prefill de quality](../decisions/0006-capture-replay-devmode-prefill.md)

## Notas de Implementação

- Camadas afetadas: shared (tipos) / frontend renderer (PrintConfigPanel, PrintPage, types) / frontend main (`ipc/printer.ts`, `services/printerConfig.ts`, `services/printQueue.ts`, `preload.ts`) / backend (route + validator)
- Arquivos-chave:
  - `packages/frontend/electron/services/printerConfig.ts` — `showPrinterPreferences(name): Promise<boolean>`
  - `packages/frontend/electron/ipc/printer.ts` — orquestra fila + gate + print
  - `packages/frontend/src/types/printer.ts` — `PrintJobResult` discriminado
  - `packages/frontend/src/pages/PrintPage.tsx` — distingue success/cancelled/error
- Testes:
  - Unit: `printerService.spec.ts` cobre o novo retorno
  - E2E manual: ver "Verificação manual" abaixo
- Riscos:
  - Drivers que ignoram alterações específicas no diálogo (ex: alguns drivers Epson antigos travam quality via firmware) — mitigação é fora do escopo do app
  - PowerShell desabilitado por política → o gate falha "fechado" (retorna false = cancelled)

### Verificação manual E2E

1. Abrir o app, selecionar uma ordem e a impressora L3250 (ou similar Epson).
2. Configurar quality "rascunho" no painel e clicar em **Imprimir**.
3. **Esperar:** diálogo nativo de Preferências da Epson abre; nenhuma notificação de warning aparece.
4. No diálogo, ajustar quality para "Draft" / "Rascunho" e clicar **OK**.
5. **Esperar:** PDF imprime com a qualidade escolhida; toast verde "Impressão enviada com sucesso"; entrada criada em `/print-jobs`.
6. Repetir, mas ao abrir o diálogo clicar **Cancelar**.
7. **Esperar:** nada imprime; **nenhum toast aparece**; **nenhuma entrada em `/print-jobs`**.
8. Abrir Painel de Controle → Impressoras → Propriedades L3250 → confirmar que quality default agora é o último valor confirmado.
