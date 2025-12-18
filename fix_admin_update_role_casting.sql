-- Fix pour la fonction admin_update_user_role
-- Problème: column "role" is of type user_role_type but expression is of type text
-- Solution: Cast explicite du paramètre TEXT en user_role_type

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role TEXT DEFAULT NULL,
  p_is_admin BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Accès refusé: vous devez être administrateur';
  END IF;

  -- Empêcher un admin de se retirer ses propres droits admin
  IF p_user_id = auth.uid() AND p_is_admin = false THEN
    RAISE EXCEPTION 'Vous ne pouvez pas retirer vos propres droits administrateur';
  END IF;

  -- Mettre à jour ou insérer le rôle (avec cast explicite)
  INSERT INTO public.user_roles (user_id, role, is_admin)
  VALUES (
    p_user_id,
    COALESCE(p_role::user_role_type, 'client'::user_role_type),
    COALESCE(p_is_admin, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(p_role::user_role_type, user_roles.role),
    is_admin = COALESCE(p_is_admin, user_roles.is_admin),
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pas besoin de re-grant car on remplace juste la fonction
-- Les permissions sont déjà en place

SELECT '✅ Fonction admin_update_user_role corrigée avec cast explicite!' as resultat;
