-- Migration: Agendar checagem de alertas de preço a cada 15 minutos via pg_cron
-- ELE-7: Sistema de alertas de preço por e-mail

-- Primeiro, garantir que a extensão pg_cron está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar a Edge Function send-price-alert para rodar a cada 15 minutos
-- Nota: pg_cron pode não estar disponível em todos os planos Supabase.
-- Se pg_cron não estiver disponível, usar Supabase Scheduled Functions (via Dashboard).
-- Esta migration registra o cron job para ambientes self-hosted / pg_cron habilitado.

SELECT cron.schedule(
  'check-price-alerts',          -- nome do job
  '*/15 * * * *',                -- a cada 15 minutos
  $$SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-price-alert',
    headers := jsonb_build_object('Authorization', 'Bearer <ANON_KEY>'),
    body := '{}'
  )$$
);