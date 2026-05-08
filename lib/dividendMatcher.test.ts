import { matchDividendsWithUserEntries, UserDividendEntry } from './dividendMatcher';
import { DividendRecord } from '@/types/market';

describe('dividendMatcher', () => {
  const makeDividend = (ticker: string, date: string, rate: number): DividendRecord => ({
    paymentDate: date,
    rate,
    type: 'DIVIDENDO',
    relatedTo: ticker,
    declaredDate: date,
    lastDatePrior: date,
  });

  it('should return all source dividends if user has no entries', () => {
    const sourceDividends: DividendRecord[] = [
      makeDividend('PETR4', '2026-01-15', 1.50),
      makeDividend('VALE3', '2026-02-10', 2.00),
    ];
    const userEntries: UserDividendEntry[] = [];

    const result = matchDividendsWithUserEntries(sourceDividends, userEntries);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.suggested === true)).toBe(true);
  });

  it('should filter out dividends already entered by user', () => {
    const sourceDividends: DividendRecord[] = [
      makeDividend('PETR4', '2026-01-15', 1.50),
      makeDividend('PETR4', '2026-04-15', 1.60),
      makeDividend('VALE3', '2026-02-10', 2.00),
    ];
    const userEntries: UserDividendEntry[] = [
      { ticker: 'PETR4', paymentDate: '2026-01-15' },
    ];

    const result = matchDividendsWithUserEntries(sourceDividends, userEntries);
    expect(result).toHaveLength(2);
    expect(result[0].relatedTo).toBe('PETR4');
    expect(result[0].paymentDate).toBe('2026-04-15');
    expect(result[1].relatedTo).toBe('VALE3');
  });
});
