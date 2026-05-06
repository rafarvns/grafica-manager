# ADR 0006: Pré-seleção de qualidade no diálogo via capture-replay de DEVMODE

**Status:** Accepted
**Date:** 2026-05-05
**Author:** rafarvns
**Context Specs:** 0032 (Print Quality Fix)
**Revises (parcialmente):** [ADR 0005](0005-print-preferences-gate-via-documentproperties.md)

---

## Contexto

A ADR 0005 estabeleceu o uso de `DocumentProperties` (Win32) com `DM_IN_PROMPT | DM_OUT_BUFFER | DM_IN_BUFFER` para abrir o diálogo nativo de Preferências de Impressão já com o prefill da app (orientation, copies, quality, color, duplex). Investigação posterior revelou que o prefill de **quality** não funciona em drivers Epson de tinta (L3250, EcoTank em geral).

### Evidência (logs reais com a impressora L3250 Series(Rede))

```
[GET]    fields=0x7809B0F  ← saved default da impressora (DM_PRINTQUALITY e DM_YRESOLUTION NÃO setados)
[APPLY]  fields=0x780BF0F  ← nossa modificação adicionou DM_PRINTQUALITY (0x400) + DM_YRESOLUTION (0x2000)
[MERGE]  fields=0x7809B0F  ← driver LIMPOU os dois bits durante DM_IN_BUFFER|DM_OUT_BUFFER
[DIALOG] fields=0x7809B0F  ← diálogo abre com saved default, ignora qualquer prefill
```

O driver Epson L3250 armazena o "modo de qualidade" **inteiramente na extensão privada** do DEVMODE (`dmDriverExtra`), não nos campos públicos. Tentativas de modificar `dmPrintQuality` e `dmYResolution`:
- com DPI literal (180/360/720) → rejeitado;
- com enum padrão (`DMRES_DRAFT=-1`/`-3`/`-4`) → rejeitado;
- com merge step (`DM_IN_BUFFER|DM_OUT_BUFFER` antes do prompt) → rejeitado;

O `DrvDocumentEvent` do driver normaliza o DEVMODE durante o merge e zera as flags que não correspondem a um modo válido na sua tabela interna.

### Pesquisa externa

- **Microsoft KB 167345** ([Modify printer settings with DocumentProperties](https://learn.microsoft.com/en-us/troubleshoot/windows/win32/modify-printer-settings-documentproperties)): "a valid DEVMODE structure for a device contains private data that can only be modified by the DocumentProperties() function".
- **TCL wiki — Windows Printing: dict to DEVMODE to dict** ([link](https://wiki.tcl-lang.org/page/Windows+Printing%3A+dict+to+DEVMODE+to+dict)): blobs DEVMODE devem ser tratados como opacos e invalidados quando a versão do driver muda. "Only take the driver extra data, if blob has right size... it is from same driver version."
- **PrintTicket / `ConvertPrintTicketToDevMode`** (System.Printing.Interop, ReachFramework.dll): API moderna que poderia gerar um DEVMODE com qualidade desejada para drivers V4. Foi descartada porque vários drivers Epson de tinta não expõem `psk:Draft|Normal|High` completos no PrintCapabilities — falha silenciosa.

**Quatro alternativas avaliadas:**

### Opção A: Capture-replay (RECOMENDADO)

```
✓ Funciona em QUALQUER driver (Epson, HP, Canon, V3, V4, postscript, raster)
✓ DEVMODE replicado é garantidamente válido — foi gerado pelo próprio diálogo na sessão anterior
✓ Sem dependência da extensão privada — tratada como blob opaco
✓ Cache invalida automaticamente em update de driver (versão muda → key muda)
✗ Primeira impressão de cada qualidade abre sem prefill — usuário configura uma vez
✗ Storage adicional em userData (~50KB total mesmo com 10 impressoras × 3 qualidades)
```

### Opção B: PrintTicket + `ConvertPrintTicketToDevMode`

```
✓ Funciona primeira vez sem onboarding
✓ API oficial moderna para drivers V4
✗ Driver Epson de tinta pode não expor psk:Draft/Normal/High no GPD/PPD — silent fail
✗ Requer carregar System.Printing.Interop / ReachFramework.dll via Add-Type
✗ Falhas são surdas (DEVMODE gerado parece OK mas não reflete qualidade real)
```

### Opção C: Manipulação direta de `dmDriverExtra`

```
✓ Funcionaria em teoria
✗ Layout da extensão privada é undocumented e específico por driver/versão
✗ Manutenção impossível para múltiplos modelos
✗ Risco de corromper config da impressora
```

### Opção D: Aceitar que quality não pré-preenche

```
✓ Zero código adicional
✗ Usuário precisa setar quality no diálogo TODA vez — UX inaceitável dado fluxo de gráfica
```

---

## Decisão

**Opção A — Capture-replay de DEVMODE blob** indexado por `(printerName, driverVersionHash, quality)`.

### Mecânica

```
showPrinterPreferences(printerName, prefill) →
  cacheKey   = "{sanitized(printerName)}__{driverHash}__{quality}"
  cached     = loadDevmodeBlob(matchingFile)        // null se primeira vez
  snapshot   = GET DEVMODE                           // para rollback
  if cached: SetPrinter level 9 com `cached`        // pre-stage do default da impressora
  rDlg       = DocumentProperties(DM_OUT_BUFFER | DM_IN_PROMPT [| DM_IN_BUFFER se houver overrides públicos])
  if rDlg == IDCANCEL e prestaged: SetPrinter level 9 com `snapshot`     // rollback
  if rDlg == IDOK:
    write postDialogDevmode → outputFile
    saveDevmodeBlob(cacheKey, postDialogDevmode)    // captura para próxima vez
  return rDlg == IDOK
```

A `driverHash` é montada de `dmSpecVersion`, `dmDriverVersion`, `dmSize`, `dmDriverExtra` lidos no GET — invalida o cache se o driver for atualizado.

### Justificativa

1. **Garantia de funcionamento** — o blob salvo é exatamente o que o diálogo do driver produziu numa sessão real. Replicá-lo via `SetPrinter` level 9 reproduz aquele estado fielmente.
2. **Driver-agnóstico** — não faz suposições sobre como o driver organiza qualidade (público vs. privado).
3. **Degradação graciosa** — primeira vez por qualidade abre sem prefill (usuário configura uma vez); demais campos seguros (orientation/copies/color/duplex) continuam pré-preenchidos via `DM_IN_BUFFER`.
4. **Sem dependências novas** — usa as mesmas APIs Win32 já em uso (`OpenPrinter`, `DocumentProperties`, `SetPrinter`).
5. **Validação automática** — comparação de `dmSpecVersion + dmDriverVersion + dmSize + dmDriverExtra` no replay; mismatch → ignora cache.

---

## Consequências

### Positivas

- ✓ Quality pré-preenche corretamente a partir da segunda impressão de cada nível.
- ✓ Funciona em drivers que ignoram totalmente os campos públicos de quality.
- ✓ Não requer driver V4 ou PrintTicket — funciona em V3 também.
- ✓ Cancelar no diálogo continua abortando o print (gate da ADR 0005 preservado).
- ✓ Rollback do default da impressora se usuário cancelar após pre-stage.

### Negativas

- ✗ Primeiro print de cada qualidade abre sem prefill — UX precisa comunicar isso (toast/help).
- ✗ Cache obsoleto em `userData/printer-presets/` se driver atualizar (mitigado: validação por versão).
- ✗ Cache não compartilhado entre instalações/máquinas. Aceito: contexto é máquina de gráfica única.

### Mitigação

- **Versão divergente:** Se cached blob não bate com versão atual, ignora silenciosamente e abre dialog sem prefill. Próxima OK regrava cache com versão correta.
- **Permissão admin negada:** Pre-stage não acontece (`OpenPrinter(USE)` em vez de `ADMINISTER`); comportamento equivale ao de antes.
- **Concorrência:** já tratada por `printQueue.ts` (ADR 0005) — sem race condition no SetPrinter.
- **Cleanup de blobs órfãos:** futuros (não no escopo desta ADR) — varrer cache periodicamente removendo entries cuja `printerName` não existe mais.

---

## Especificação Técnica

### Arquivos afetados

| Arquivo | Mudança |
| --- | --- |
| `packages/frontend/electron/services/devmodeCache.ts` (novo) | `buildCacheKey`, `loadDevmodeBlob`, `saveDevmodeBlob` em `app.getPath('userData')/printer-presets/`. |
| `packages/frontend/electron/services/printerConfig.ts` | C# inline reescrito para snapshot/pre-stage/rollback/captura. PS aceita `-CachedDevmodePath` e `-OutputDevmodePath`. TS layer carrega/salva blob no cache e parseia driverHash do stderr da PS. |
| `packages/frontend/electron/ipc/printer.ts` | Sem mudança (cache transparente). |

### Quality removida do prefill público

Os campos `dmPrintQuality` e `dmYResolution` **não são mais modificados** pelo C#. Quality vem 100% via blob cached. Os demais campos públicos (`dmOrientation`, `dmCopies`, `dmColor`, `dmDuplex`) seguem sendo aplicados via `DM_IN_BUFFER` — testes mostram que o L3250 respeita esses no diálogo.

### Layout de cache

```
%APPDATA%/grafica-manager/printer-presets/
  L3250 Series(Rede)__s1025d258z156x96__rascunho.devmode    (~500B binário)
  L3250 Series(Rede)__s1025d258z156x96__normal.devmode
  L3250 Series(Rede)__s1025d258z156x96__alta.devmode
```

`s{spec}d{driver}z{size}x{extra}` = driver hash. Ao abrir o diálogo, TS lista candidatos por prefixo `{printer}__` e sufixo `__{quality}.devmode`, ordena por mtime desc, e tenta o mais recente. Em mismatch interno (validação no C#), o blob é ignorado e o dialog abre sem prefill.

---

## Referências

- [Spec 0032: Print Quality Fix](../specs/0032-print-quality-fix.md)
- [ADR 0005: Diálogo como gate via DocumentProperties](0005-print-preferences-gate-via-documentproperties.md)
- [Microsoft KB 167345: Modify printer settings with DocumentProperties](https://learn.microsoft.com/en-us/troubleshoot/windows/win32/modify-printer-settings-documentproperties)
- [Microsoft Docs — SetPrinter (PRINTER_INFO_9)](https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinter)
- [TCL wiki — Windows Printing: dict to DEVMODE to dict](https://wiki.tcl-lang.org/page/Windows+Printing%3A+dict+to+DEVMODE+to+dict)
- [Apriorit — Configuring Printer Settings programmatically](https://www.apriorit.com/dev-blog/211-set-printer-settings)

---

## Status de Aprovação

- [x] Alinhado com spec 0032 atualizada
- [x] Avaliadas alternativas (Opções A, B, C, D)
- [x] Mitigações documentadas
- [x] Implementação concluída — pendente verificação E2E manual com L3250
