import { describe, expect, test, beforeEach, spyOn, mock, Mock } from 'bun:test';

// Instead of mocking deep dependencies which bun test struggles with sometimes,
// let's create a pure implementation file and test that, or mock the server module directly

mock.module('@/utils/supabase/server', () => {
  return {
    createClient: async () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null })
          })
        }),
        upsert: async () => ({ error: null })
      })
    })
  };
});

import { withCache, inMemoryCache } from './dataCache';
import * as supabaseKv from './supabaseKv';

describe('dataCache', () => {
  let getSpy: Mock<(...args: unknown[]) => unknown>;
  let setSpy: Mock<(...args: unknown[]) => unknown>;

  beforeEach(() => {
    inMemoryCache.clear();
    getSpy = spyOn(supabaseKv, 'getSupabaseKV').mockImplementation(async () => null) as unknown as Mock<(...args: unknown[]) => unknown>;
    setSpy = spyOn(supabaseKv, 'setSupabaseKV').mockImplementation(async () => {}) as unknown as Mock<(...args: unknown[]) => unknown>;

    // Clear spy mock history
    getSpy.mockClear();
    setSpy.mockClear();
  });

  test('withCache - fetches and caches when empty (Memory Miss + KV Miss)', async () => {
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

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  test('withCache - returns cached data if not expired (Memory Hit)', async () => {
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

    // getSupabaseKV should only be called once on the first miss
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  test('withCache - Memory Miss + KV Hit', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      return { price: 10 };
    };

    const futureDate = new Date(Date.now() + 10000).toISOString();
    getSpy.mockImplementation(async () => ({
      value: { price: 99 },
      expires_at: futureDate
    }));

    const result = await withCache('test-key', mockFetcher, 1000);

    expect(result.data).toEqual({ price: 99 });
    expect(result.cache_hit).toBe(true);
    expect(result.stale).toBe(false);
    expect(callCount).toBe(0); // Fetcher should not be called

    expect(getSpy).toHaveBeenCalledTimes(1);
    // Because it was a KV hit, we don't set it again
    expect(setSpy).toHaveBeenCalledTimes(0);

    // Check if it populated memory cache
    const memCacheResult = inMemoryCache.get('test-key');
    expect(memCacheResult).toBeDefined();
    expect(memCacheResult?.value).toEqual({ price: 99 });
  });

  test('withCache - fetches new data if expired (Memory Miss + KV Miss/Expired)', async () => {
    let callCount = 0;
    const mockFetcher = async () => {
      callCount++;
      return { price: callCount };
    };

    // Mock KV returning expired data
    const pastDate = new Date(Date.now() - 10000).toISOString();
    getSpy.mockImplementation(async () => ({
      value: { price: 99 },
      expires_at: pastDate
    }));

    // Call once, KV is expired, fetches new data (price: 1), but wait we are just testing the expired flow directly
    const result = await withCache('expired-key', mockFetcher, 1000);

    expect(result.data).toEqual({ price: 1 });
    expect(result.cache_hit).toBe(false);
    expect(result.stale).toBe(false);
    expect(callCount).toBe(1);
  });

  test('withCache - returns stale data if fetcher throws (Memory Fallback)', async () => {
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

  test('withCache - returns stale data if fetcher throws (KV Fallback)', async () => {
    const mockFetcher = async () => {
      throw new Error('API down');
    };

    const pastDate = new Date(Date.now() - 10000).toISOString();
    // In fallback logic, it checks KV if Memory throws and is empty.
    let kvCalls = 0;
    getSpy.mockImplementation(async () => {
      kvCalls++;
      // First call (normal lookup) -> returns expired data or null
      // Second call (fallback) -> returns the stale data
      return {
        value: { price: 55 },
        expires_at: pastDate
      };
    });

    const result = await withCache('kv-fallback-key', mockFetcher, 1000);

    expect(result.data).toEqual({ price: 55 });
    expect(result.cache_hit).toBe(true);
    expect(result.stale).toBe(true);
    expect(kvCalls).toBe(2); // One for initial check, one for fallback
  });

  test('withCache - throws if no cache and fetcher throws', async () => {
    const mockFetcher = async () => {
      throw new Error('API down');
    };

    expect(withCache('empty-fail-key', mockFetcher, 1000)).rejects.toThrow('API down');
  });
});
