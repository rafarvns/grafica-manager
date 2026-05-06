# ADR 0005: Diálogo de Preferências como gate cancelável via Win32 DocumentProperties

**Status:** Accepted (revisado parcialmente por [ADR 0006](0006-capture-replay-devmode-prefill.md))
**Date:** 2026-05-05
**Author:** rafarvns
**Context Specs:** 0032 (Print Quality Fix)
**Supersedes:** [ADR 0004](0004-aplicacao-qualidade-via-devmode-powershell.md)
**Revised by:** [ADR 0006](0006-capture-replay-devmode-prefill.md) (apenas o prefill de quality — o gate cancelável via DocumentProperties continua válido)

---

## Contexto

A primeira implementação da spec 0032 (ADR 0004) tentava:

1. Snapshot da config via `Get-PrintConfiguration`
2. `Set-PrintConfiguration -PrintQuality Draft|Normal|High` **antes** do print
3. Abrir Preferências via `rundll32 printui.dll,PrintUIEntry /e`
4. Print silencioso
5. `Set-PrintConfiguration` para restaurar

Dois problemas surgiram em uso real:

### Problema 1: Warning persistente para drivers Epson

Drivers Epson de tinta (L3250, EcoTank) usam DEVMODE proprietário e ignoram a propriedade padrão `PrintQuality` do Windows. Para esses drivers, `Set-PrintConfiguration -PrintQuality` retorna stderr com mensagem de "propriedade não suportada", disparando o warning broadcast em toda impressão. O warning era tecnicamente correto (RF5 da spec), mas ruidoso e não acionável — o usuário ainda precisava configurar quality manualmente no diálogo da Epson que abria logo depois.

### Problema 2: Falta de cancelamento real

O comando `rundll32 printui.dll,PrintUIEntry /e` abre o diálogo mas **não distingue OK de Cancelar via exit code** (ambos retornam 0). Resultado: mesmo quando o usuário cancelava o diálogo, o app prosseguia com o print silencioso. O usuário pediu explicitamente que cancelar no diálogo abortasse a impressão.

**Três alternativas avaliadas:**

### Opção A: Win32 `DocumentProperties` + `SetPrinter` (RECOMENDADO)

```
✓ Retorna IDOK (1) ou IDCANCEL (2) → gate cancelável real
✓ DEVMODE round-trip captura todas as alterações do usuário, inclusive proprietárias
✓ SetPrinter level 9 persiste o DEVMODE inteiro (não só campos padrão) → drivers Epson respeitam
✓ Sem dependências novas (winspool.drv built-in, P/Invoke via PowerShell+C# inline)
✓ "Apply nada antes do OK" → atende ao pedido do usuário literalmente
✗ Compilação Add-Type adiciona ~2s de overhead na primeira invocação
✗ Sem permissão admin na impressora → SetPrinter falha; gate ainda funciona mas alterações não persistem
```

### Opção B: Manter rundll32 + diff DEVMODE para detectar OK/Cancel

```
✓ Mantém o diálogo familiar do printui.dll
✗ Diff não distingue "OK sem alterações" de "Cancel" (ambos: DEVMODE inalterado)
✗ Não resolve o problema 1 do warning (que é independente do diálogo)
```

### Opção C: `System.Windows.Forms.PrintDialog` (.NET)

```
✓ OK/Cancel explícito via DialogResult
✗ Mostra o **diálogo de Print** (com copies/page-range), não Preferências
✗ Quality fica atrás de "Properties" (dois cliques) em vez de direto
✗ Settings escolhidos ficam em $dlg.PrinterSettings — não persistem no driver, e SumatraPDF não aceita PrinterSettings .NET
```

---

## Decisão

**Opção A: Win32 `DocumentProperties` (DM_IN_PROMPT | DM_OUT_BUFFER) + `SetPrinter` level 9, invocados via PowerShell + C# inline (`Add-Type`).**

### Mecânica

```
showPrinterPreferences(name, prefill) →
  1. OpenPrinter(name, ALL_ACCESS) — falhou? → OpenPrinter(name, USE) [modo somente-leitura]
  2. DocumentProperties(0, h, name, NULL, NULL, 0)              → tamanho do DEVMODE
  3. malloc(size) → dm
  4. DocumentProperties(0, h, name, dm, NULL, DM_OUT_BUFFER)    → lê DEVMODE atual
  5. (se há prefill) sobrescreve campos públicos no struct (orient, copies, quality, color, duplex)
  6. (se há prefill) DocumentProperties(0, h, name, dm, dm, DM_IN_BUFFER|DM_OUT_BUFFER)
       ↑ MERGE — driver normaliza a extensão privada (dmDriverExtra) com base nos campos públicos.
         Sem isso, drivers Epson exibem o quality antigo no diálogo mesmo com dmPrintQuality
         e dmYResolution corretos no public DEVMODE.
  7. DocumentProperties(0, h, name, dm, prefill ? dm : NULL, DM_IN_PROMPT|DM_OUT_BUFFER|[DM_IN_BUFFER])
       ↓ abre o diálogo nativo já com a pré-seleção, usuário ajusta, clica OK ou Cancel
       → IDOK (1)     → SetPrinter(h, 9, &PRINTER_INFO_9{pDevMode=dm})  [persiste novo default]
       → IDCANCEL (2) → não persiste nada
  8. retorna true (OK) ou false (Cancel)

ipc:print-pdf →
  enqueueForPrinter(name, async () => {
    if (!await showPrinterPreferences(name)) return {status:'cancelled'};
    return await ptp.print(file, {...options, silent:true})
             ? {status:'success'} : {status:'error', error:...};
  })
```

### Justificativa

1. **Atende literalmente os dois pedidos:**
   - "Não setar nada antes do OK" → `SetPrinter` só roda quando `DocumentProperties` retorna `IDOK`.
   - "Cancel aborta o print" → `IDCANCEL` retorna `false`, IPC retorna `{status:'cancelled'}`, sem print, sem POST `/print-jobs`.
2. **Captura DEVMODE proprietário** — `DM_OUT_BUFFER` retorna o DEVMODE *inteiro* (incluindo extensão privada do driver Epson). `SetPrinter` level 9 persiste isso em bloco. Drivers que respeitam o seu próprio DEVMODE proprietário (a maioria) **passam** a aplicar a qualidade.
3. **Sem dependências novas** — `winspool.drv` é built-in no Windows. P/Invoke via PowerShell `Add-Type -Language CSharp` é incluído no Windows 10+ (alvo do projeto). Custo de compilação na primeira chamada (~2s) é aceitável dado que o usuário acabou de clicar Imprimir e está esperando o diálogo.
4. **Sem ruído na UX** — o canal `printer:quality-warning` foi removido. Não há mais warning broadcast porque não há mais tentativa de aplicar quality fora do diálogo.

---

## Consequências

### Positivas

- ✓ Cancelar no diálogo aborta o print de verdade (zero print job, zero log no backend).
- ✓ Drivers proprietários (Epson, HP, Canon) respeitam o DEVMODE inteiro persistido — quality finalmente "vale".
- ✓ Sem warning intrusivo — UX limpa para todos os drivers.
- ✓ Lógica simples: um único caminho (`showPrinterPreferences → ptp.print silent`) em vez de snapshot/apply/restore.
- ✓ Concorrência preservada via `printQueue.ts` (não muda com a nova decisão).

### Negativas

- ✗ O usuário **precisa** interagir com o diálogo a cada print (não há mais print "100% silencioso" via app). Aceito porque era exatamente o comportamento pedido.
- ✗ Compilação inicial do `Add-Type` C# adiciona ~2s de delay. Mitigado pelo fato de que o diálogo é interativo — o usuário não percebe.
- ✗ Em impressoras de rede sem `PRINTER_ACCESS_ADMINISTER`, o gate funciona mas o `SetPrinter` é pulado — alterações no diálogo só valem para a sessão. Aceito como graceful degradation (raro no fluxo de gráfica local).
- ✗ Se PowerShell estiver desabilitado por política corporativa, o gate falha "fechado" (cancelled) — usuário não consegue imprimir até habilitar PS. Aceito; ambiente alvo é máquina de gráfica autônoma.

### Mitigação

- **Sanitização do `printerName`:** whitelist `[A-Za-z0-9 _\-().,#]+`; rejeita entradas que não casem (mesma regra da ADR 0004, mantida).
- **Fallback de permissão:** tenta `OpenPrinter` com `ALL_ACCESS` primeiro; em falha, retenta com `USE`. Diálogo abre nos dois casos; só persistência muda.
- **Timeout do diálogo:** 5 minutos. Se o usuário deixar aberto além disso, processo PS é morto e a chamada retorna `cancelled`.
- **Fila por impressora:** mantida (`printQueue.ts`). Impede que dois cliques simultâneos abram dois diálogos para a mesma impressora.

---

## Especificação Técnica

### Arquivos afetados

| Arquivo | Mudança |
| --- | --- |
| `packages/frontend/electron/services/printerConfig.ts` | Reescrito. Removidas `getCurrentQuality`, `applyQuality`, `restoreQuality`, `openPrintPreferences`. Adicionada `showPrinterPreferences(name): Promise<boolean>`. |
| `packages/frontend/electron/ipc/printer.ts` | Fluxo simplificado: `printWithDialogGate` chama `showPrinterPreferences`; cancelado → retorna `{status:'cancelled'}`; OK → `performPtpPrint`. Removido `broadcastQualityWarning`. |
| `packages/frontend/src/types/printer.ts` | Adicionado tipo discriminado `PrintJobResult`. |
| `packages/frontend/src/types/electron.d.ts` | `printPdf` retorna `Promise<PrintJobResult>`. Removido `onQualityWarning`. |
| `packages/frontend/electron/preload.ts` | Removido `onQualityWarning`. |
| `packages/frontend/src/services/printerService.ts` e `ipcBridge.ts` | Tipo do retorno atualizado. |
| `packages/frontend/src/pages/PrintPage.tsx` | Distingue 3 status: `success` (toast verde + zera filePath), `cancelled` (silencioso, **sem** POST `/print-jobs`), `error` (toast vermelho). |

### C# helper inline (resumido)

```csharp
public static int Show(string name) {
    var pdAdmin = new PRINTER_DEFAULTS { DesiredAccess = PRINTER_ACCESS_ADMINISTER | PRINTER_ACCESS_USE };
    var pdUse   = new PRINTER_DEFAULTS { DesiredAccess = PRINTER_ACCESS_USE };
    IntPtr h;
    bool canPersist = OpenPrinter(name, out h, ref pdAdmin);
    if (!canPersist && !OpenPrinter(name, out h, ref pdUse)) return 2;
    try {
        int size = DocumentProperties(0, h, name, 0, 0, 0);
        IntPtr dm = Marshal.AllocHGlobal(size);
        try {
            int r = DocumentProperties(0, h, name, dm, 0, DM_IN_PROMPT | DM_OUT_BUFFER);
            if (r != IDOK) return 1;
            if (canPersist) {
                var info9 = new PRINTER_INFO_9 { pDevMode = dm };
                IntPtr p = Marshal.AllocHGlobal(Marshal.SizeOf<PRINTER_INFO_9>());
                try {
                    Marshal.StructureToPtr(info9, p, false);
                    SetPrinter(h, 9, p, 0);
                } finally { Marshal.FreeHGlobal(p); }
            }
            return 0;
        } finally { Marshal.FreeHGlobal(dm); }
    } finally { ClosePrinter(h); }
}
```

Exit codes do PowerShell: `0` = OK, `1` = Cancel, `2` = falha (open/document properties). O TS trata `0` como `true` e qualquer outro como `false`.

---

## Referências

- [Spec 0032: Print Quality Fix](../specs/0032-print-quality-fix.md) (atualizada)
- [ADR 0004: Aplicação via DEVMODE PowerShell](0004-aplicacao-qualidade-via-devmode-powershell.md) (Superseded)
- [Microsoft Docs — DocumentProperties](https://learn.microsoft.com/windows/win32/printdocs/documentproperties)
- [Microsoft Docs — SetPrinter](https://learn.microsoft.com/windows/win32/printdocs/setprinter) (PRINTER_INFO_9)
- [Microsoft Docs — OpenPrinter](https://learn.microsoft.com/windows/win32/printdocs/openprinter)

---

## Status de Aprovação

- [x] Alinhado com spec 0032 atualizada
- [x] Avaliadas alternativas (Opções A, B, C)
- [x] Mitigações documentadas
- [x] Implementação concluída e testada localmente
- [x] Atualização (2026-05-05): adicionado merge step `DM_IN_BUFFER|DM_OUT_BUFFER` antes do prompt — verificou-se que drivers Epson rejeitam mesmo assim os campos públicos de quality. Estratégia substituída para quality: ver [ADR 0006 (capture-replay)](0006-capture-replay-devmode-prefill.md). O gate cancelável (OK/Cancel) e o prefill dos demais campos (orientation/copies/color/duplex) continuam via essa ADR.
