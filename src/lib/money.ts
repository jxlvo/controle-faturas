// Valores em reais são guardados como número decimal (Float). Para não acumular erros de
// ponto flutuante ao somar (ex: 0.1 + 0.2 = 0.30000000000000004), as contas são feitas em centavos.

/** Converte reais em centavos inteiros (ex: 19.9 → 1990). */
export function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Arredonda um valor em reais para 2 casas decimais (ex: 19.899999 → 19.9). */
export function roundMoney(value: number): number {
  return toCents(value) / 100;
}

/** Soma valores em reais e devolve o total em centavos, sem erro de arredondamento. */
export function sumInCents(values: number[]): number {
  return values.reduce((total, value) => total + toCents(value), 0);
}

/** Formata centavos como texto no padrão brasileiro, sem o "R$" (ex: 123450 → "1234,50"). */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
