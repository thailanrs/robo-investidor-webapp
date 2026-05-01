import { getSupabaseKV, setSupabaseKV } from './supabaseKv';

export interface CacheResult<T> {
  data: T;
  stale: boolean;
  cachedAt: string;
  cache_hit: boolean;
}

interface CacheEntry<T> {
  value: T;
  cachedAt: number; // timestamp ms
  ttlMs: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const inMemoryCache = new InMemoryCache();

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<CacheResult<T>> {
  const cached = inMemoryCache.get<T>(key);
  const now = Date.now();

  // Nível 1: In-Memory cache hit (not expired)
  if (cached && now - cached.cachedAt < cached.ttlMs) {
    return {
      data: cached.value,
      stale: false,
      cachedAt: new Date(cached.cachedAt).toISOString(),
      cache_hit: true,
    };
  }

  // Nível 2: Supabase KV lookup
  try {
    const kvData = await getSupabaseKV<T>(key);
    if (kvData) {
      const expiresAt = new Date(kvData.expires_at).getTime();

      // Hit KV cache (not expired)
      if (now < expiresAt) {
        // Popula memCache
        inMemoryCache.set(key, kvData.value, expiresAt - now);

        return {
          data: kvData.value,
          stale: false,
          cachedAt: new Date(now - (ttlMs - (expiresAt - now))).toISOString(), // Approximate cachedAt
          cache_hit: true,
        };
      }
    }
  } catch (error) {
    console.error(`[BRAPI CACHE] Error reading from KV cache for key ${key}:`, error);
  }

  try {
    const data = await fetcher();

    // Nível 1: Set In-Memory cache
    inMemoryCache.set(key, data, ttlMs);

    // Nível 2: Set Supabase KV cache
    try {
      await setSupabaseKV(key, data, ttlMs);
    } catch (error) {
       console.error(`[BRAPI CACHE] Error writing to KV cache for key ${key}:`, error);
    }

    return {
      data,
      stale: false,
      cachedAt: new Date().toISOString(),
      cache_hit: false,
    };
  } catch (error) {
    // Falhou em buscar, retornar stale data se existir in memory
    if (cached) {
      return {
        data: cached.value,
        stale: true,
        cachedAt: new Date(cached.cachedAt).toISOString(),
        cache_hit: true,
      };
    }

    // Falhou em buscar, procurar em Supabase KV como ultimo fallback (stale)
    try {
      const kvData = await getSupabaseKV<T>(key);
      if (kvData) {
        return {
          data: kvData.value,
          stale: true,
          cachedAt: new Date().toISOString(), // approximated
          cache_hit: true,
        };
      }
    } catch (kvError) {
      console.error(`[BRAPI CACHE] Error reading stale data from KV cache for key ${key}:`, kvError);
    }

    throw error;
  }
}
