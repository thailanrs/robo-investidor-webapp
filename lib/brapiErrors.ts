import { NextResponse } from 'next/server';

export class BrapiError extends Error {
  public statusCode?: number;
  public ticker?: string;
  public endpoint?: string;

  constructor(message: string, statusCode?: number, ticker?: string, endpoint?: string) {
    super(message);
    this.name = 'BrapiError';
    this.statusCode = statusCode;
    this.ticker = ticker;
    this.endpoint = endpoint;
  }
}

export class RateLimitError extends BrapiError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number, ticker?: string, endpoint?: string) {
    super(message, 429, ticker, endpoint);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends BrapiError {
  constructor(message: string = 'Authentication failed', ticker?: string, endpoint?: string) {
    super(message, 401, ticker, endpoint);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends BrapiError {
  constructor(message: string = 'Not found', ticker?: string, endpoint?: string) {
    super(message, 404, ticker, endpoint);
    this.name = 'NotFoundError';
  }
}

export class BrapiUnavailableError extends BrapiError {
  constructor(message: string = 'Brapi service unavailable', statusCode?: number, ticker?: string, endpoint?: string) {
    super(message, statusCode, ticker, endpoint);
    this.name = 'BrapiUnavailableError';
  }
}

export function parseBrapiError(response: Response, ticker?: string, endpoint?: string): BrapiError {
  const status = response.status;
  const message = `Brapi request failed with status ${status}`;

  if (status === 429) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
    return new RateLimitError(message, retryAfter, ticker, endpoint);
  }

  if (status === 401) {
    return new AuthenticationError(message, ticker, endpoint);
  }

  if (status === 404) {
    return new NotFoundError(message, ticker, endpoint);
  }

  if (status >= 500) {
    return new BrapiUnavailableError(message, status, ticker, endpoint);
  }

  return new BrapiError(message, status, ticker, endpoint);
}

export function isBrapiError(err: unknown): err is BrapiError {
  return err instanceof BrapiError;
}

export function handleBrapiError(error: unknown, ticker?: string): NextResponse {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: error.retryAfter, ticker },
      { status: 429 }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: 'Asset not found', ticker },
      { status: 404 }
    );
  }

  if (error instanceof BrapiUnavailableError) {
    return NextResponse.json(
      { error: 'Brapi service unavailable' },
      { status: 503 }
    );
  }

  if (error instanceof BrapiError) {
    return NextResponse.json(
      { error: error.message, ticker },
      { status: error.statusCode ?? 500 }
    );
  }

  console.error('[BRAPI] Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
