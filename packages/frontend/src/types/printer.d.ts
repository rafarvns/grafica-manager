export declare enum PrinterStatus {
    READY = 0,
    PAUSED = 1,
    ERROR = 2,
    PENDING_DELETION = 4,
    PAPER_JAM = 8,
    PAPER_OUT = 16,
    MANUAL_FEED = 32,
    PAPER_PROBLEM = 64,
    OFFLINE = 128,
    IO_ACTIVE = 256,
    BUSY = 512,
    PRINTING = 1024,
    OUTPUT_BIN_FULL = 2048,
    NOT_AVAILABLE = 4096,
    WAITING = 8192,
    PROCESSING = 16384,
    INITIALIZING = 32768,
    WARMING_UP = 65536,
    TONER_LOW = 131072,
    NO_TONER = 262144,
    PAGE_PUNT = 524288,
    USER_INTERVENTION = 1048576,
    OUT_OF_MEMORY = 2097152,
    DOOR_OPEN = 4194304,
    SERVER_UNKNOWN = 8388608,
    POWER_SAVE = 16777216
}
export interface Printer {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: Record<string, string>;
}
export interface PrintOptions {
    printer?: string;
    pages?: string;
    subset?: 'odd' | 'even';
    orientation?: 'portrait' | 'landscape';
    scale?: 'noscale' | 'shrink' | 'fit';
    monochrome?: boolean;
    side?: 'duplex' | 'duplexshort' | 'duplexlong' | 'simplex';
    bin?: string;
    paperSize?: string;
    silent?: boolean;
    printDialog?: boolean;
    copies?: number;
}
//# sourceMappingURL=printer.d.ts.map