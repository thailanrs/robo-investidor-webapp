-- Drop public insert policy since we now use SERVICE_ROLE_KEY
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'historico_analises') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Permitir inserção pública" ON public.historico_analises;';
  END IF;
END $$;

-- Fix search path mutable warning
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public;';
  END IF;
END $$;
