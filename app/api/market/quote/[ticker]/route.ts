import { NextRequest, NextResponse } from 'next/server';
import { brapiClient } from '@/lib/brapi';
import { withCache } from '@/lib/brapiCache';
import { logBrapiRequest } from '@/lib/brapiLogger';
import { isBrapiError, RateLimitError, NotFoundError, BrapiUnavailableError } from '@/lib/brapiErrors';

async function fetchWithRetry<T>(fetcher: () => Promise<T>, retries = 2, delay = 200): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    if (retries > 0 && isBrapiError(error) && error.statusCode !== 401 && error.statusCode !== 404) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fetcher, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  // 1. Validate ticker
  const tickerUpper = ticker.toUpperCase();
  const tickerRegex = /^[A-Z]{4}\d{1,2}$|^[A-Z]{5,6}$/;

  if (!tickerRegex.test(tickerUpper)) {
    return NextResponse.json(
      { error: 'Invalid ticker format' },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  let cacheHit = false;
  let isStale = false;
  let statusCode = 200;
  let errorType: string | undefined;

  try {
    // 2 & 3. Call withCache and exponential backoff retry
    const result = await fetchWithRetry(() =>
      withCache(
        `quote:${tickerUpper}`,
        () => brapiClient.getQuote(tickerUpper),
        60_000
      )
    );

    cacheHit = result.cache_hit;
    isStale = result.stale;

    // Log success
    const latency_ms = Date.now() - startTime;
    logBrapiRequest({
      ticker: tickerUpper,
      endpoint: 'quote',
      latency_ms,
      cache_hit: cacheHit,
      stale: isStale,
      status_code: 200
    }).catch(console.error);

    // 4. Return result with Cache-Control
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      }
    });

  } catch (error: unknown) {
    const latency_ms = Date.now() - startTime;

    if (isBrapiError(error)) {
      statusCode = error.statusCode || 500;
      errorType = error.name;

      logBrapiRequest({
        ticker: tickerUpper,
        endpoint: 'quote',
        latency_ms,
        cache_hit: false,
        stale: false,
        status_code: statusCode,
        error_type: errorType
      }).catch(console.error);

      if (error instanceof RateLimitError) {
        const headers = new Headers();
        if (error.retryAfter) {
          headers.set('Retry-After', error.retryAfter.toString());
        }
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers }
        );
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          { error: 'Ticker not found', ticker: tickerUpper },
          { status: 404 }
        );
      }

      if (error.statusCode === 401) {
        // AuthenticationError -> 500
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    } else {
      statusCode = 500;
      errorType = 'UnknownError';
      logBrapiRequest({
        ticker: tickerUpper,
        endpoint: 'quote',
        latency_ms,
        cache_hit: false,
        stale: false,
        status_code: 500,
        error_type: 'UnknownError'
      }).catch(console.error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
