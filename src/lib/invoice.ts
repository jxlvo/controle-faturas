// Dia do mês em que a fatura vence. As faturas são identificadas pelo mês do VENCIMENTO
// (é o mês que vem no nome do CSV do Nubank, ex: Nubank_2026-11-01.csv).
// Fechamento dia 25 e vencimento dia 1: as compras de 26/09 a 25/10 caem na fatura que vence em 01/11.
export const INVOICE_DUE_DAY = 1;

/**
 * Mês (AAAA-MM) da fatura que vence a seguir, ou seja, a que você ainda vai pagar.
 * Usa a data de hoje no fuso de São Paulo.
 *
 * Com vencimento dia 1:
 *   - de 02/10 a 31/10 → "2026-11" (a fatura que vence em 01/11)
 *   - em 01/11 (dia do vencimento) → ainda "2026-11"
 *   - a partir de 02/11 → "2026-12"
 */
export function nextDueInvoiceMonth(now: Date = new Date(), dueDay: number = INVOICE_DUE_DAY): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  let year = get('year');
  let month = get('month');
  const day = get('day');

  // Se o vencimento deste mês já passou, a próxima fatura a pagar vence no mês seguinte
  if (day > dueDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}
