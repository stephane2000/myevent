-- Création d'une fonction sécurisée pour récupérer le rôle utilisateur
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- FONCTION POUR RÉCUPÉRER ROLE + IS_ADMIN
-- ========================================

-- Cette fonction bypass RLS de manière sécurisée
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TABLE(role user_role_type, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role, ur.is_admin
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- Donner les permissions à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- Test de la fonction
SELECT * FROM public.get_current_user_role();

SELECT '✅ Fonction get_current_user_role() créée avec succès!' as resultat;
