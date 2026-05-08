-- Drop brapi_request_logs (telemetria BRAPI, 0 registros)
DROP TABLE IF EXISTS public.brapi_request_logs;

-- Rename brapi_cache → data_cache (KV genérico)
ALTER TABLE IF EXISTS public.brapi_cache RENAME TO data_cache;
