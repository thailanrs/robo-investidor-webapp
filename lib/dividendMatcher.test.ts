import { describe, expect, it } from 'bun:test';
import { matchDividendsWithUserEntries, UserDividendEntry } from './dividendMatcher';
import { DividendRecord } from '@/types/brapi';

describe('dividendMatcher', () => {
  it('should return all Brapi dividends if user has no entries', () => {
    const brapiDividends: DividendRecord[] = [
      {
        paymentDate: '2023-05-15T00:00:00.000Z',
        rate: 0.5,
        type: 'DIVIDENDO',
        relatedTo: 'ITUB4',
        declaredDate: '2023-04-15T00:00:00.000Z',
        lastDatePrior: '2023-04-30T00:00:00.000Z'
      }
    ];

    const userEntries: UserDividendEntry[] = [];

    const result = matchDividendsWithUserEntries(brapiDividends, userEntries);
    expect(result.length).toBe(1);
    expect(result[0].suggested).toBe(true);
    expect(result[0].rate).toBe(0.5);
  });

  it('should filter out dividends that user already entered for the same ticker', () => {
    const brapiDividends: DividendRecord[] = [
      {
        paymentDate: '2023-05-15T00:00:00.000Z',
        rate: 0.5,
        type: 'DIVIDENDO',
        relatedTo: 'ITUB4',
        declaredDate: '2023-04-15T00:00:00.000Z',
        lastDatePrior: '2023-04-30T00:00:00.000Z'
      },
      {
        paymentDate: '2023-06-15T00:00:00.000Z',
        rate: 0.6,
        type: 'JCP',
        relatedTo: 'ITUB4',
        declaredDate: '2023-05-15T00:00:00.000Z',
        lastDatePrior: '2023-05-31T00:00:00.000Z'
      }
    ];

    const userEntries: UserDividendEntry[] = [
      {
        ticker: 'ITUB4',
        paymentDate: '2023-05-15'
      }
    ];

    const result = matchDividendsWithUserEntries(brapiDividends, userEntries);
    expect(result.length).toBe(1);
    expect(result[0].paymentDate).toBe('2023-06-15T00:00:00.000Z');
    expect(result[0].suggested).toBe(true);
  });
});
