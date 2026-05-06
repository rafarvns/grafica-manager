# ADR 0004: Aplicação da qualidade de impressão via DEVMODE PowerShell + diálogo Windows

**Status:** Superseded by [ADR 0005](0005-print-preferences-gate-via-documentproperties.md) (2026-05-05)
**Date:** 2026-05-05
**Author:** rafarvns
**Context Specs:** 0032 (Print Quality Fix), 0005 (Integração Impressoras), 0007 (Print Parameters Configuration)

> **Nota de superseção:** Esta ADR foi substituída na mesma data. A estratégia de aplicar qualidade *antes* do print via `Set-PrintConfiguration` gerou warning persistente em drivers Epson de tinta (L3250, EcoTank em geral) que ignoram a propriedade padrão do Windows. O usuário também pediu que o diálogo nativo passasse a ser um **gate cancelável** (Cancelar = aborta o print). Ambos os requisitos são atendidos por DocumentProperties Win32 — ver ADR 0005.

---

## Contexto

A spec 0032 demanda que a escolha de qualidade do usuário (`DRAFT|NORMAL|HIGH`) realmente afete a saída física da impressora. A lib atual `pdf-to-printer` (que envolve `SumatraPDF.exe -print-settings`) **não aceita** parâmetros de qualidade ou DPI — a renderização depende do DEVMODE do driver Windows.

O usuário pediu explicitamente: "abrir o diálogo de impressão do sistema com parâmetros iniciais já preenchidos".

**Quatro estratégias avaliadas:**

### Opção A: PowerShell DEVMODE + diálogo nativo (RECOMENDADO)

```
✓ Atende ao pedido do usuário (diálogo nativo com qualidade pré-selecionada)
✓ Zero dependências novas (PowerShell built-in no Windows)
✓ Cabe no constraint de 4GB RAM (CLAUDE.md §2)
✓ Try/finally restaura config original — sem efeitos colaterais persistentes
✗ Drivers podem ignorar Set-PrintConfiguration -PrintQuality (alguns drivers)
✗ DEVMODE compartilhado entre jobs → exige fila serializada por impressora
```

### Opção B: Ghostscript pré-processamento de PDF

```
✓ Determinístico em qualquer impressora (downsample DPI no PDF)
✗ ~50MB instalado, dependência externa do sistema
✗ Conflito com CLAUDE.md §2 ("pacotes pesados são proibidos")
✗ Pré-processamento de PDFs grandes pode travar UI em 4GB RAM
```

### Opção C: Electron `webContents.print({silent: false, dpi})`

```
✓ Aceita dpi: { horizontal, vertical } e abre diálogo com pré-seleção
✗ Bug conhecido (electron#26448, electron#30947): loadURL(pdfPath) + print() retorna em branco
✗ Requer carregar PDF em BrowserWindow oculta — overhead de memória
✗ Inviável até bug ser corrigido upstream
```

### Opção D: Aceitar limitação (quality vira só metadado)

```
✓ Zero código adicional
✗ Quebra expectativa do usuário (que pediu controle real)
✗ Mantém ilusão na UI sem efeito
```

---

## Decisão

**Opção A: PowerShell `Set-PrintConfiguration` + `pdf-to-printer printDialog: true`**

### Mecânica

1. **Snapshot:** `Get-PrintConfiguration -PrinterName "X"` → JSON com config atual.
2. **Apply:** `Set-PrintConfiguration -PrinterName "X" -PrintQuality Draft|Normal|High`.
3. **Print:** `pdf-to-printer.print(filePath, { printer, printDialog: true, ...outras })`.
4. **Diálogo Windows abre lendo o DEVMODE atualizado** → qualidade pré-marcada.
5. **Usuário confirma (ou ajusta)** — pode mudar para outra qualidade no diálogo.
6. **Restore:** `Set-PrintConfiguration -PrinterName "X" -PrintQuality <snapshot.PrintQuality>` em `try/finally`.

Se Set-PrintConfiguration retornar erro ou for ignorado, exibe notificação ao usuário ("Sua impressora pode não suportar troca de qualidade via software — ajuste manualmente") e segue com `printDialog: true` mesmo assim.

### Justificativa

1. **Atende ao pedido literal** — diálogo nativo com pré-seleção é exatamente o que o usuário descreveu.
2. **Sem dependências novas** — PowerShell + cmdlets de impressora são built-in no Windows 8+ (sempre disponível no contexto do projeto, alvo Windows 10+).
3. **Custo de memória zero** — `child_process.spawn('powershell.exe', ...)` é leve; não exige BrowserWindow extra.
4. **Reversível** — `try/finally` garante que a configuração da impressora volta ao estado anterior.
5. **Compatível com `pdf-to-printer`** — não troca a lib, apenas adiciona uma camada antes/depois.

---

## Consequências

### Positivas

- ✓ Usuário vê o diálogo de impressão e tem controle visual.
- ✓ Quality é aplicada de fato no driver — saída física diferente entre rascunho e alta (em impressoras compatíveis).
- ✓ Funcionalidade incremental: backwards-compatível com fluxos atuais (basta passar `quality` no `PrintOptions`).

### Negativas

- ✗ Drivers que ignoram `-PrintQuality` viram falsos-positivos (nada acontece). Mitigação: detectar e avisar.
- ✗ Concorrência no DEVMODE compartilhado — dois jobs simultâneos podem sobrescrever um ao outro. Mitigação: `printQueue.ts` serializa por `printerName`.
- ✗ Dependente do shell PowerShell — se desabilitado por política corporativa, fallback é abrir diálogo sem aplicar (usuário escolhe manualmente).
- ✗ Sanitização do `printerName` é necessária para evitar command injection.

### Mitigação

- **Detecção de falha:** parsear stderr do PowerShell; se contiver "not supported" ou similar, marcar `ok: false` e notificar usuário.
- **Fila por impressora:** `Map<printerName, Promise<void>>` em `services/printQueue.ts` serializa jobs.
- **Sanitização:** whitelist `[A-Za-z0-9 _\-\(\)]+` no `printerName`; rejeitar entradas que não casem.
- **Timeout PS:** 5s por chamada; se exceder, abortar e seguir sem aplicar.
- **Restore best-effort:** falha em restore só vira log no main process — não interrompe usuário.

---

## Especificação Técnica

### Comandos PowerShell

```powershell
# Snapshot
Get-PrintConfiguration -PrinterName "HP LaserJet" | ConvertTo-Json -Compress

# Apply
Set-PrintConfiguration -PrinterName "HP LaserJet" -PrintQuality Draft

# Restore
Set-PrintConfiguration -PrinterName "HP LaserJet" -PrintQuality Normal
```

### Mapeamento enum → cmdlet

```typescript
const psQualityMap: Record<PrintQuality, 'Draft'|'Normal'|'High'> = {
  [PrintQuality.DRAFT]:  'Draft',
  [PrintQuality.NORMAL]: 'Normal',
  [PrintQuality.HIGH]:   'High',
};
```

### Estrutura de arquivos

```
packages/frontend/electron/services/
├── printerConfig.ts   # getCurrentQuality, applyQuality, restoreQuality
└── printQueue.ts      # Map<printerName, Promise> serializando jobs
```

### Fluxo no IPC handler

```typescript
ipcMain.handle('printer:print-pdf', async (_, filePath, options) => {
  return enqueueForPrinter(options.printer, async () => {
    const snap = await getCurrentQuality(options.printer);
    const result = await applyQuality(options.printer, options.quality);
    if (!result.ok) {
      mainWindow.webContents.send('printer:quality-warning', result.warning);
    }
    try {
      await ptp.print(filePath, { ...options, printDialog: true });
      return true;
    } finally {
      await restoreQuality(options.printer, snap).catch(logError);
    }
  });
});
```

---

## Referências

- [Spec 0032: Print Quality Fix](../specs/0032-print-quality-fix.md)
- [ADR 0003: Padronização PrintQuality enum](0003-padronizacao-print-quality-enum.md)
- [Microsoft Docs — Set-PrintConfiguration](https://learn.microsoft.com/powershell/module/printmanagement/set-printconfiguration)
- [electron/electron#26448](https://github.com/electron/electron/issues/26448) — bug "PDF print blank"
- [pdf-to-printer print options](file:///E:/LivreSolucoes/games/grafica-manager/node_modules/.pnpm/pdf-to-printer@5.8.0/node_modules/pdf-to-printer/dist/print/print.d.ts)

---

## Status de Aprovação

- [x] Alinhado com spec 0032
- [x] Avaliadas alternativas (Opções A, B, C, D)
- [x] Mitigações documentadas
- [ ] Implementação iniciada (próximo passo)
