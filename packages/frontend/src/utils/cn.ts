/**
 * Compõe classNames de CSS Modules filtrando valores falsy.
 * Uso: cn(styles.base, isActive && styles.active, className)
 */
export function cn(
  ...classes: (string | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}
