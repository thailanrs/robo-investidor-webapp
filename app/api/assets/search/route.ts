import { NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { withCache } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { handleBrapiError } from '@/lib/brapiErrors';

const CACHE_TTL_24H = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const type = searchParams.get('type');

  const brapiParams: Record<string, string> = {};
  if (search) brapiParams.search = search;
  if (type) brapiParams.type = type;

  const cacheKey = `assets:search:${search || ''}:${type || ''}`;
  const start = Date.now();

  try {
    const fetcher = async () => {
      const response = await brapiClient.getQuoteList(brapiParams);
      return response.stocks;
    };

    const { data: stocks, stale, cache_hit } = await withCache(
      cacheKey,
      fetcher,
      CACHE_TTL_24H
    );

    logBrapiRequest({
      endpoint: '/quote/list',
      latency_ms: Date.now() - start,
      cache_hit,
      stale
    }).catch(console.error);

    return NextResponse.json({ stocks, stale });
  } catch (error) {
    return handleBrapiError(error);
  }
}
