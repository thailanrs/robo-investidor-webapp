import { NextRequest, NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { withCache as getCached } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { handleBrapiError } from '@/lib/brapiResponseHelpers';
import { FundamentalsData } from '@/types/brapi';

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
      `fundamentals:${tickerUpper}`,
      () => brapiClient.getFundamentals(tickerUpper),
      24 * 60 * 60 * 1000 // 24 hours TTL
    );

    cacheHit = result.cache_hit;
    isStale = result.stale;

    const data = result.data.results?.[0] || {};

    const fundamentals: FundamentalsData = {
      priceEarnings: data.priceEarnings ?? null,
      earningsPerShare: data.earningsPerShare ?? null,
      priceToBook: data.priceToBook ?? null,
      dividendYield: data.dividendYield ?? null,
      revenueGrowth: data.revenueGrowth ?? null,
      revenuePerShare: data.revenuePerShare ?? null,
      recommendationKey: data.recommendationKey ?? null,
      numberOfAnalystOpinions: data.numberOfAnalystOpinions ?? null,
      targetMeanPrice: data.targetMeanPrice ?? null,
      targetHighPrice: data.targetHighPrice ?? null,
      targetLowPrice: data.targetLowPrice ?? null,
    };

    // Replace any undefined with null, just in case any value evaluates to undefined
    for (const key of Object.keys(fundamentals) as Array<keyof FundamentalsData>) {
      if (fundamentals[key] === undefined) {
        (fundamentals as any)[key] = null;
      }
    }

    // Log success
    const latency_ms = Date.now() - startTime;
    logBrapiRequest({
      ticker: tickerUpper,
      endpoint: 'fundamentals',
      latency_ms,
      cache_hit: cacheHit,
      stale: isStale,
      status_code: 200
    }).catch(console.error);

    return NextResponse.json({
      ticker: tickerUpper,
      fundamentals,
      stale: isStale
    });

  } catch (error: unknown) {
    const latency_ms = Date.now() - startTime;
    const tickerParam = typeof tickerUpper !== 'undefined' ? tickerUpper : undefined;

    logBrapiRequest({
      ticker: tickerParam,
      endpoint: 'fundamentals',
      latency_ms,
      cache_hit: false,
      stale: false,
      status_code: (error as any)?.statusCode || 500,
      error_type: (error as any)?.name || 'UnknownError'
    }).catch(console.error);

    return handleBrapiError(error, tickerParam);
  }
}
