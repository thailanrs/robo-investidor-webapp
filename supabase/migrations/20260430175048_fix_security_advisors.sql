-- 1. Fix historico_analises RLS policy
DROP POLICY IF EXISTS "Permitir inserção e leitura pública" ON public.historico_analises;

CREATE POLICY "Permitir leitura pública"
ON public.historico_analises
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserção pública"
ON public.historico_analises
FOR INSERT
TO public
WITH CHECK (true);

-- 2. Revoke public execute on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 3. Restrict listing on avatars bucket
DROP POLICY IF EXISTS "Qualquer um pode ver avatares" ON storage.objects;

CREATE POLICY "Permitir visualização de avatares públicos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars'::text);

CREATE POLICY "Permitir listar os proprios avatares"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars'::text AND auth.uid() = owner);
