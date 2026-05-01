import { describe, expect, test } from 'bun:test';
import {
  BrapiError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  BrapiUnavailableError,
  parseBrapiError,
  isBrapiError
} from './brapiErrors';

describe('brapiErrors', () => {
  test('parseBrapiError - 429 Rate Limit', () => {
    const mockResponse = new Response(null, {
      status: 429,
      headers: { 'Retry-After': '5' }
    });
    const error = parseBrapiError(mockResponse, 'PETR4', 'quote');

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.statusCode).toBe(429);
    expect((error as RateLimitError).retryAfter).toBe(5);
    expect(error.ticker).toBe('PETR4');
    expect(error.endpoint).toBe('quote');
    expect(isBrapiError(error)).toBe(true);
  });

  test('parseBrapiError - 401 Auth', () => {
    const mockResponse = new Response(null, { status: 401 });
    const error = parseBrapiError(mockResponse);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.statusCode).toBe(401);
    expect(isBrapiError(error)).toBe(true);
  });

  test('parseBrapiError - 404 Not Found', () => {
    const mockResponse = new Response(null, { status: 404 });
    const error = parseBrapiError(mockResponse, 'INVALID');

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.ticker).toBe('INVALID');
    expect(isBrapiError(error)).toBe(true);
  });

  test('parseBrapiError - 500 Server Error', () => {
    const mockResponse = new Response(null, { status: 503 });
    const error = parseBrapiError(mockResponse);

    expect(error).toBeInstanceOf(BrapiUnavailableError);
    expect(error.statusCode).toBe(503);
    expect(isBrapiError(error)).toBe(true);
  });

  test('parseBrapiError - generic error', () => {
    const mockResponse = new Response(null, { status: 400 });
    const error = parseBrapiError(mockResponse);

    expect(error).toBeInstanceOf(BrapiError);
    expect(error.statusCode).toBe(400);
    expect(isBrapiError(error)).toBe(true);
  });

  test('isBrapiError on regular Error', () => {
    expect(isBrapiError(new Error('Normal error'))).toBe(false);
  });
});
