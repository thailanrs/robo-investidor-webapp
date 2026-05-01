CREATE TABLE brapi_cache (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_brapi_cache_expires ON brapi_cache(expires_at);
