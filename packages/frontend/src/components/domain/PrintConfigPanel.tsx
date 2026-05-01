import React from 'react';
import styles from './PrintConfigPanel.module.css';

export interface PrintConfig {
  quality: 'rascunho' | 'normal' | 'alta';
  colorMode: 'CMYK' | 'RGB' | 'GRAYSCALE';
  orientation: 'portrait' | 'landscape';
  side: 'simplex' | 'duplex' | 'duplexshort';
  copies: number;
  pageRanges: string;
}

interface PrintConfigPanelProps {
  config: PrintConfig;
  onChange: (config: PrintConfig) => void;
  disabled?: boolean;
  warnings?: Set<keyof PrintConfig>;
  maxPages?: number;
}

// Aceita: "", "1", "1-5", "1-5, 8, 11-13", "2,4,6"
const PAGE_RANGE_REGEX = /^(\d+(-\d+)?)(\s*,\s*(\d+(-\d+)?))*$/;

function isValidPageRange(value: string): boolean {
  if (value.trim() === '') return true;
  return PAGE_RANGE_REGEX.test(value.trim());
}

export function PrintConfigPanel({ config, onChange, disabled, warnings, maxPages }: PrintConfigPanelProps) {
  const set = <K extends keyof PrintConfig>(key: K, val: PrintConfig[K]) =>
    onChange({ ...config, [key]: val });

  const warn = (key: keyof PrintConfig) => warnings?.has(key) ?? false;

  const pageRangeInvalid = !isValidPageRange(config.pageRanges);

  return (
    <div className={styles.grid}>
      <div className={warn('quality') ? `${styles.field} ${styles.fieldWarning}` : styles.field}>
        <label htmlFor="pc-quality">Qualidade</label>
        <select
          id="pc-quality"
          value={config.quality}
          onChange={(e) => set('quality', e.target.value as PrintConfig['quality'])}
          disabled={disabled}
        >
          <option value="rascunho">Rascunho</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
        </select>
        {warn('quality') && <span className={styles.warningText}>Diverge do pedido</span>}
      </div>

      <div className={warn('colorMode') ? `${styles.field} ${styles.fieldWarning}` : styles.field}>
        <label htmlFor="pc-color">Cor</label>
        <select
          id="pc-color"
          value={config.colorMode}
          onChange={(e) => set('colorMode', e.target.value as PrintConfig['colorMode'])}
          disabled={disabled}
        >
          <option value="GRAYSCALE">Preto e branco</option>
          <option value="CMYK">Colorido (CMYK)</option>
          <option value="RGB">Colorido (RGB)</option>
        </select>
        {warn('colorMode') && <span className={styles.warningText}>Diverge do pedido</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="pc-orientation">Orientação</label>
        <select
          id="pc-orientation"
          value={config.orientation}
          onChange={(e) => set('orientation', e.target.value as PrintConfig['orientation'])}
          disabled={disabled}
        >
          <option value="portrait">Retrato</option>
          <option value="landscape">Paisagem</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="pc-side">Impressão</label>
        <select
          id="pc-side"
          value={config.side}
          onChange={(e) => set('side', e.target.value as PrintConfig['side'])}
          disabled={disabled}
        >
          <option value="simplex">Frente</option>
          <option value="duplex">Frente e verso (longo)</option>
          <option value="duplexshort">Frente e verso (curto)</option>
        </select>
      </div>

      <div className={warn('copies') ? `${styles.field} ${styles.fieldWarning}` : styles.field}>
        <label htmlFor="pc-copies">Cópias</label>
        <input
          id="pc-copies"
          type="number"
          min={1}
          max={999}
          value={config.copies}
          onChange={(e) => set('copies', Math.max(1, parseInt(e.target.value) || 1))}
          disabled={disabled}
        />
        {warn('copies') && <span className={styles.warningText}>Diverge do pedido</span>}
      </div>

      <div className={[
        styles.field,
        styles.fieldFull,
        warn('pageRanges') ? styles.fieldWarning : '',
        pageRangeInvalid ? styles.fieldError : '',
      ].filter(Boolean).join(' ')}>
        <label htmlFor="pc-pages">Intervalo de Páginas</label>
        <input
          id="pc-pages"
          type="text"
          placeholder="ex: 1-5, 8, 11-13  (vazio = todas)"
          value={config.pageRanges}
          onChange={(e) => set('pageRanges', e.target.value)}
          disabled={disabled}
          aria-invalid={pageRangeInvalid}
        />
        {maxPages !== undefined && (
          <span className={styles.hint}>Produto tem até {maxPages} página(s)</span>
        )}
        {pageRangeInvalid && (
          <span className={styles.errorText}>Formato inválido — use ex: 1-5, 8, 11-13</span>
        )}
        {!pageRangeInvalid && warn('pageRanges') && (
          <span className={styles.warningText}>Diverge do pedido</span>
        )}
      </div>
    </div>
  );
}
