import type { ColumnOptions } from 'typeorm';

// Precisão única de todos os campos numéricos não inteiros.
export const DECIMAL: ColumnOptions = {
  type: 'numeric',
  precision: 18,
  scale: 6,
};

// Monta o texto de um CHECK que limita uma coluna a uma lista de valores.
export function inList(column: string, values: readonly string[]): string {
  const items = values.map((value) => `'${value}'`).join(', ');
  return `"${column}" IN (${items})`;
}
