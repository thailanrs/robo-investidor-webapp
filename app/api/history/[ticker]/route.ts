import { NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { withCache } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { handleBrapiError } from '@/lib/brapiErrors';
import { OHLCVDataPoint } from '@/types/brapi';

const CACHE_TTL_1H = 60 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker.toUpperCase();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1y';
    const interval = searchParams.get('interval') || '1d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const brapiParams: Record<string, string> = { range, interval };
    if (startDate) brapiParams.startDate = startDate;
    if (endDate) brapiParams.endDate = endDate;

    const cacheKey = `history:${ticker}:${range}:${interval}:${startDate || ''}:${endDate || ''}`;
    const start = Date.now();

    const fetcher = async () => {
      // getQuote endpoint is /quote/{ticker}
      // using the generic typing from brapiClient but we need to deal with historicalDataPrice
      const response = await brapiClient.getQuote(ticker, brapiParams) as any;
      
      const result = response.results?.[0];
      if (!result || !result.historicalDataPrice) {
        throw new Error('Historical data not found in response');
      }

      // Convert Unix timestamp (seconds) to 'YYYY-MM-DD'
      const data: OHLCVDataPoint[] = result.historicalDataPrice.map((item: any) => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      return data;
    };

    const { data, stale, cache_hit } = await withCache(
      cacheKey,
      fetcher,
      CACHE_TTL_1H
    );

    logBrapiRequest({
      ticker,
      endpoint: `/quote/${ticker} (history)`,
      latency_ms: Date.now() - start,
      cache_hit,
      stale
    }).catch(console.error);

    return NextResponse.json({
      ticker,
      range,
      interval,
      data,
      stale
    });
  } catch (error) {
    const ticker = await params.then(p => p.ticker).catch(() => undefined);
    return handleBrapiError(error, ticker);
  }
}
