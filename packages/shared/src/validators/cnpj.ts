/**
 * Validates a CNPJ format (XX.XXX.XXX/XXXX-XX)
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const regex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return regex.test(cnpj);
}
