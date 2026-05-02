import { DividendRecord } from '@/types/brapi';

export interface UserDividendEntry {
  ticker: string;
  paymentDate: string; // YYYY-MM-DD or ISO string
}

export interface DividendSuggestion extends DividendRecord {
  suggested: boolean;
}

export function matchDividendsWithUserEntries(
  brapiDividends: DividendRecord[],
  userEntries: UserDividendEntry[]
): DividendSuggestion[] {
  return brapiDividends
    .filter(brapiDiv => {
      // Formata a data de pagamento da Brapi para considerar apenas YYYY-MM-DD
      const brapiDate = brapiDiv.paymentDate.split('T')[0];
      const brapiTicker = brapiDiv.relatedTo;

      // Verifica se existe algum lançamento do usuário para a mesma data e mesmo ticker
      const hasEntry = userEntries.some(entry => {
        const entryDate = entry.paymentDate.split('T')[0];
        return entryDate === brapiDate && entry.ticker === brapiTicker;
      });

      return !hasEntry;
    })
    .map(brapiDiv => ({
      ...brapiDiv,
      suggested: true
    }));
}
