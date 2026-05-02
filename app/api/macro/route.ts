import { NextRequest, NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { withCache as getCached } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { handleBrapiError } from '@/lib/brapiResponseHelpers';
import { CurrencyRate, MacroPrimeRate } from '@/types/brapi';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cacheHit = false;
  let isStale = false;

  try {
    const result = await getCached(
      `macro:overview`,
      async () => {
        const [currencyRes, primeRatesRes] = await Promise.all([
          brapiClient.getCurrencies('USD-BRL,EUR-BRL'),
          brapiClient.getPrimeRates('brazil')
        ]);
        return { currencyRes, primeRatesRes };
      },
      1 * 60 * 60 * 1000 // 1 hour TTL
    );

    cacheHit = result.cache_hit;
    isStale = result.stale;

    const rawCurrencies = result.data.currencyRes?.currency || [];
    const mappedCurrencies: CurrencyRate[] = rawCurrencies.map((c: any) => ({
      pair: c.name || (c.fromCurrency + '-' + c.toCurrency),
      bidPrice: Number(c.bidPrice || c.high || 0),
      percentChange: Number(c.pctChange !== undefined ? c.pctChange : (c.varBid || 0)),
      updatedAtDate: c.updatedAtDate || c.create_date || ''
    }));

    const rawRates = result.data.primeRatesRes?.['prime-rate'] || [];
    const rates: MacroPrimeRate[] = rawRates.map((r: any) => ({
      name: r.name,
      value: Number(r.value || 0),
      unit: r.unit || '%',
      effectiveDate: r.date || ''
    }));

    // Log success
    const latency_ms = Date.now() - startTime;
    logBrapiRequest({
      endpoint: 'macro',
      latency_ms,
      cache_hit: cacheHit,
      stale: isStale,
      status_code: 200
    }).catch(console.error);

    return NextResponse.json({
      currencies: mappedCurrencies,
      rates,
      stale: isStale
    });

  } catch (error: unknown) {
    const latency_ms = Date.now() - startTime;

    logBrapiRequest({
      endpoint: 'macro',
      latency_ms,
      cache_hit: false,
      stale: false,
      status_code: (error as any)?.statusCode || 500,
      error_type: (error as any)?.name || 'UnknownError'
    }).catch(console.error);

    return handleBrapiError(error);
  }
}
