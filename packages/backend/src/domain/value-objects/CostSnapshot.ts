/**
 * Value Object que representa um snapshot de custo congelado no momento da impressão.
 * Imutável após criação para manter integridade auditorial.
 */
export class CostSnapshot {
  private readonly value: number;
  private readonly timestamp: Date;
  private readonly unitPrice: number;
  private readonly pageCount: number;

  constructor(unitPrice: number, pageCount: number, timestamp: Date = new Date()) {
    if (unitPrice < 0) {
      throw new Error('Preço unitário não pode ser negativo');
    }

    if (pageCount <= 0) {
      throw new Error('Número de páginas deve ser maior que 0');
    }

    this.unitPrice = unitPrice;
    this.pageCount = pageCount;
    this.timestamp = timestamp;
    this.value = unitPrice * pageCount;
  }

  getValue(): number {
    return this.value;
  }

  getUnitPrice(): number {
    return this.unitPrice;
  }

  getPageCount(): number {
    return this.pageCount;
  }

  getTimestamp(): Date {
    return new Date(this.timestamp);
  }

  equals(other: CostSnapshot): boolean {
    return this.value === other.value && this.timestamp === other.timestamp;
  }

  toString(): string {
    return `CostSnapshot(value=${this.value}, unitPrice=${this.unitPrice}, pageCount=${this.pageCount})`;
  }
}
