import { toCents } from './money';

export type CsvExpense = { date: string; title: string; amount: number };
export type StoredExpense = { purchaseDate: string; title: string; amount: number };

// Dia da compra no formato AAAA-MM-DD. Datas já em ISO (como no CSV do Nubank) são lidas
// direto do texto, para o fuso horário do navegador nunca mudar o dia.
function dayOf(date: string): string {
  const text = date.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

function keyOf(date: string, title: string, amount: number): string {
  return `${dayOf(date)}|${title.trim()}|${toCents(amount)}`;
}

/**
 * Tira da fila as compras do CSV que já estão gravadas no banco para aquele mês de fatura.
 *
 * A comparação conta ocorrências: se o CSV tem duas compras idênticas no mesmo dia (dois cafés de
 * R$ 5,00, por exemplo) e só uma foi gravada, a outra continua na fila. Isso também permite
 * retomar uma fatura que você parou no meio, sem classificar de novo o que já foi feito.
 */
export function removeAlreadyImported(
  rows: CsvExpense[],
  stored: StoredExpense[]
): { pending: CsvExpense[]; skipped: number } {
  const remaining = new Map<string, number>();
  for (const item of stored) {
    const key = keyOf(item.purchaseDate, item.title, item.amount);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  const pending: CsvExpense[] = [];
  let skipped = 0;

  for (const row of rows) {
    const key = keyOf(row.date, row.title, row.amount);
    const count = remaining.get(key) ?? 0;

    if (count > 0) {
      remaining.set(key, count - 1);
      skipped++;
    } else {
      pending.push(row);
    }
  }

  return { pending, skipped };
}
