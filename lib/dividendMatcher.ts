import { DividendRecord } from '@/types/market';

export interface UserDividendEntry {
  ticker: string;
  paymentDate: string; // YYYY-MM-DD or ISO string
}

export interface DividendSuggestion extends DividendRecord {
  suggested: boolean;
}

export function matchDividendsWithUserEntries(
  sourceDividends: DividendRecord[],
  userEntries: UserDividendEntry[]
): DividendSuggestion[] {
  return sourceDividends
    .filter(div => {
      // Formata a data de pagamento para considerar apenas YYYY-MM-DD
      const divDate = div.paymentDate.split('T')[0];
      const divTicker = div.relatedTo;

      // Verifica se existe algum lançamento do usuário para a mesma data e mesmo ticker
      const hasEntry = userEntries.some(entry => {
        const entryDate = entry.paymentDate.split('T')[0];
        return entryDate === divDate && entry.ticker === divTicker;
      });

      return !hasEntry;
    })
    .map(div => ({
      ...div,
      suggested: true
    }));
}
