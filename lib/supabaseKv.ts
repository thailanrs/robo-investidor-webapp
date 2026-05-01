import { createClient } from '@/utils/supabase/server';

export async function getSupabaseKV<T>(key: string): Promise<{ value: T; expires_at: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brapi_cache')
    .select('value, expires_at')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    value: data.value as T,
    expires_at: data.expires_at,
  };
}

export async function setSupabaseKV<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  await supabase
    .from('brapi_cache')
    .upsert({
      key,
      value,
      expires_at: expiresAt,
    });
}
