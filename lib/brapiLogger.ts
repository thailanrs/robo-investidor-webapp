import { createClient } from '@/utils/supabase/server';

export interface BrapiRequestLog {
  ticker?: string;
  endpoint: string;
  latency_ms: number;
  cache_hit: boolean;
  stale: boolean;
  status_code?: number;
  error_type?: string;
}

export function logBrapiRequest(params: BrapiRequestLog): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.log(`[BRAPI] ${params.endpoint} ${params.ticker || ''} - ${params.latency_ms}ms (Cache: ${params.cache_hit ? 'HIT' : 'MISS'}, Stale: ${params.stale})`);
  }

  // Non-blocking approach by not returning the promise explicitly unless needed,
  // but we return the promise here so callers CAN await if they choose to,
  // though standard usage should be `logBrapiRequest(...).catch(console.error)`
  return new Promise((resolve) => {
    createClient().then(supabase => {
      supabase
        .from('brapi_request_logs')
        .insert([{
          ticker: params.ticker,
          endpoint: params.endpoint,
          latency_ms: params.latency_ms,
          cache_hit: params.cache_hit,
          stale: params.stale,
          status_code: params.status_code,
          error_type: params.error_type
        }])
        .then(({ error }) => {
          if (error && isDev) {
            console.error('[BRAPI] Failed to log request to Supabase:', error);
          }
          resolve();
        });
    }).catch(error => {
      if (isDev) console.error('[BRAPI] Failed to initialize Supabase client for logging:', error);
      resolve();
    });
  });
}
