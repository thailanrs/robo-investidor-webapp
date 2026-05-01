import { describe, expect, test, beforeEach } from 'bun:test';
import { withCache, inMemoryCache } from './brapiCache';

describe('brapiCache', () => {
  beforeEach(() => {
    inMemoryCache.clear();
  });

  test('withCache - fetches and caches when empty', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      return { price: 10 };
    };

    const result = await withCache('test-key', mockFetcher, 1000);
    expect(result.data).toEqual({ price: 10 });
    expect(result.stale).toBe(false);
    expect(result.cache_hit).toBe(false);
    expect(callCount).toBe(1);
  });

  test('withCache - returns cached data if not expired', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      return { price: 10 };
    };

    await withCache('test-key', mockFetcher, 1000);
    const result2 = await withCache('test-key', mockFetcher, 1000);

    expect(result2.data).toEqual({ price: 10 });
    expect(result2.cache_hit).toBe(true);
    expect(result2.stale).toBe(false);
    expect(callCount).toBe(1);
  });

  test('withCache - fetches new data if expired', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      return { price: callCount };
    };

    // Cache with a negative TTL effectively makes it instantly expired
    await withCache('expired-key', mockFetcher, -1000);

    const result2 = await withCache('expired-key', mockFetcher, 1000);

    expect(result2.data).toEqual({ price: 2 });
    expect(result2.cache_hit).toBe(false);
    expect(result2.stale).toBe(false);
    expect(callCount).toBe(2);
  });

  test('withCache - returns stale data if fetcher throws', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      if (callCount === 2) throw new Error('API down');
      return { price: 10 };
    };

    // First call succeeds and caches (instantly expired so it tries again on second call)
    await withCache('fail-key', mockFetcher, -1000);

    // Second call fails, should return stale
    const result2 = await withCache('fail-key', mockFetcher, 1000);

    expect(result2.data).toEqual({ price: 10 });
    expect(result2.cache_hit).toBe(true);
    expect(result2.stale).toBe(true);
    expect(callCount).toBe(2);
  });

  test('withCache - throws if no cache and fetcher throws', async () => {
    const mockFetcher = async () => {
      throw new Error('API down');
    };

    expect(withCache('empty-fail-key', mockFetcher, 1000)).rejects.toThrow('API down');
  });
});
