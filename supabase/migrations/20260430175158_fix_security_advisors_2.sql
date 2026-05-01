-- Drop public insert policy since we now use SERVICE_ROLE_KEY
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.historico_analises;

-- Fix search path mutable warning
ALTER FUNCTION public.handle_new_user() SET search_path = public;
