import type { PrintQualityLevel } from '../../src/types/printer';
export interface PrintPreferencesPrefill {
    orientation?: 'portrait' | 'landscape';
    copies?: number;
    quality?: PrintQualityLevel;
    monochrome?: boolean;
    side?: 'simplex' | 'duplex' | 'duplexlong' | 'duplexshort';
}
/**
 * Abre o diálogo nativo de Preferências de Impressão (Win32 DocumentProperties).
 *
 * Estratégia capture-replay (vide ADR 0006):
 * - Quality é tratada via blob DEVMODE cached por (impressora, versão do driver, qualidade).
 * - Se há blob cached compatível, ele é aplicado via SetPrinter level 9 antes do diálogo —
 *   o driver lê seu próprio DEVMODE como default e exibe a qualidade correta.
 * - Demais campos (orientation/copies/color/duplex) usam DEVMODE público + DM_IN_BUFFER, que
 *   o L3250 respeita no diálogo.
 * - No OK, o DEVMODE final é capturado e salvo no cache para a próxima vez.
 * - No Cancel, rollback do default da impressora para o snapshot pre-stage.
 *
 * Retorna true se OK, false se Cancel ou erro.
 */
export declare function showPrinterPreferences(printerName: string, prefill?: PrintPreferencesPrefill): Promise<boolean>;
//# sourceMappingURL=printerConfig.d.ts.map