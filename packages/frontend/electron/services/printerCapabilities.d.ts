export interface PrinterCapabilities {
    supportsDuplex: boolean;
    supportsColor: boolean;
}
/**
 * Consulta as capacidades da impressora via Win32 `DeviceCapabilities`
 * (DC_DUPLEX, DC_COLORDEVICE). Resultado cacheado em memória por nome.
 *
 * Em caso de erro/falha, retorna `{ supportsDuplex: true, supportsColor: true }`
 * (defaults permissivos) — assumir que suporta evita restringir UI por engano.
 */
export declare function getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities>;
export declare function clearCapabilitiesCache(): void;
//# sourceMappingURL=printerCapabilities.d.ts.map