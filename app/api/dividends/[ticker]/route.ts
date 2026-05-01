import { NextRequest, NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { getCached } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { handleBrapiError } from '@/lib/brapiResponseHelpers';
import { DividendRecord } from '@/types/brapi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase();

  const startTime = Date.now();
  let cacheHit = false;
  let isStale = false;

  try {
    const result = await getCached(
      `dividends:${tickerUpper}`,
      () => brapiClient.getDividends(tickerUpper),
      12 * 60 * 60 * 1000 // 12 hours TTL
    );

    cacheHit = result.cache_hit;
    isStale = result.stale;

    const data = result.data.results?.[0];
    const rawDividends = data?.dividendsData?.cashDividends || [];

    const mappedDividends: DividendRecord[] = rawDividends.map((d: any) => ({
      paymentDate: d.paymentDate,
      rate: d.rate,
      type: d.label === 'DIVIDENDO' ? 'DIVIDENDO' : d.label === 'JCP' ? 'JCP' : 'RENDIMENTO',
      relatedTo: d.relatedTo || tickerUpper,
      declaredDate: d.approvedOn || '',
      lastDatePrior: d.lastDatePrior || ''
    }));

    // Log success
    const latency_ms = Date.now() - startTime;
    logBrapiRequest({
      ticker: tickerUpper,
      endpoint: 'dividends',
      latency_ms,
      cache_hit: cacheHit,
      stale: isStale,
      status_code: 200
    }).catch(console.error);

    return NextResponse.json({
      ticker: tickerUpper,
      dividends: mappedDividends,
      stale: isStale
    });

  } catch (error: unknown) {
    const latency_ms = Date.now() - startTime;
    const tickerParam = typeof tickerUpper !== 'undefined' ? tickerUpper : undefined;

    logBrapiRequest({
      ticker: tickerParam,
      endpoint: 'dividends',
      latency_ms,
      cache_hit: false,
      stale: false,
      status_code: (error as any)?.statusCode || 500,
      error_type: (error as any)?.name || 'UnknownError'
    }).catch(console.error);

    return handleBrapiError(error, tickerParam);
  }
}
