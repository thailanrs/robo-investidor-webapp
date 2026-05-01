-- Criar migration: supabase/migrations/20260501140000_brapi_request_logs.sql
CREATE TABLE brapi_request_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker      TEXT,
  endpoint    TEXT NOT NULL,
  latency_ms  INTEGER NOT NULL,
  cache_hit   BOOLEAN NOT NULL DEFAULT false,
  stale       BOOLEAN NOT NULL DEFAULT false,
  status_code INTEGER,
  error_type  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brapi_logs_ticker ON brapi_request_logs(ticker);
CREATE INDEX idx_brapi_logs_created_at ON brapi_request_logs(created_at DESC);

-- Enable RLS and create policy (even for logging table to follow convention)
ALTER TABLE brapi_request_logs ENABLE ROW LEVEL SECURITY;

-- Note: Since logs are inserted server-side by edge functions or API routes,
-- we allow service role to bypass RLS, but if client interaction is needed we could add:
-- CREATE POLICY "allow insert" ON brapi_request_logs FOR INSERT TO authenticated WITH CHECK (true);
