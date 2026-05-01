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
  private cache = new Map<string, CacheEntry<any>>();

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

  // TODO: Nível 2 - Supabase KV
  // O Supabase KV lookup iria aqui. Para esta implementação da história baseamos no Map,
  // e reservamos o espaço para integração real de edge functions no futuro.

  try {
    const data = await fetcher();
    inMemoryCache.set(key, data, ttlMs);

    // Set KV
    // await setSupabaseKV(key, data, ttlMs);

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

    // Todo: Falhou em buscar, procurar em Supabase KV como ultimo fallback (stale)
    // const kvData = await getSupabaseKV(key);
    // if (kvData) { ... }

    throw error;
  }
}
