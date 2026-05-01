import { NextResponse } from 'next/server';
import { isBrapiError, RateLimitError, NotFoundError } from './brapiErrors';

export function handleBrapiError(error: unknown, ticker?: string) {
  if (isBrapiError(error)) {
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
        { error: 'Ticker not found', ticker },
        { status: 404 }
      );
    }

    if (error.statusCode === 401) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
