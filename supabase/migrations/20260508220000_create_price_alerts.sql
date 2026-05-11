-- Migration: Criação da tabela price_alerts para alertas de preço (ELE-7)
-- Timestamp: 20260508220000

-- 1. Criar ENUM para direction se não existir
CREATE TYPE IF NOT EXISTS public.price_alert_direction AS ENUM ('above', 'below');

-- 2. Criar tabela price_alerts se não existir
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker text NOT NULL,
  target_price numeric NOT NULL,
  direction public.price_alert_direction NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS para que usuários só acessem seus próprios alertas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'price_alerts' 
    AND policyname = 'price_alerts_user_policy'
  ) THEN
    CREATE POLICY price_alerts_user_policy 
      ON public.price_alerts 
      FOR ALL 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id 
  ON public.price_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_ticker 
  ON public.price_alerts(ticker);

CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered_at 
  ON public.price_alerts(triggered_at);

CREATE INDEX IF NOT EXISTS idx_price_alerts_created_at 
  ON public.price_alerts(created_at DESC);

-- 6. Comentários para documentação
COMMENT ON TABLE public.price_alerts IS 'Alertas de preço configurados pelos usuários';
COMMENT ON COLUMN public.price_alerts.ticker IS 'Código do ativo (ex: PETR4, IVVB11)';
COMMENT ON COLUMN public.price_alerts.target_price IS 'Preço alvo para disparo do alerta';
COMMENT ON COLUMN public.price_alerts.direction IS 'Direção do alerta: above (acima) ou below (abaixo)';
COMMENT ON COLUMN public.price_alerts.triggered_at IS 'Timestamp de quando o alerta foi disparado (NULL se ainda não disparou)';
