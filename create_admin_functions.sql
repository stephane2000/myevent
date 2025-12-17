-- Fonctions d'administration pour MyEvent
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. FONCTION: LISTER TOUS LES UTILISATEURS (ADMIN)
-- ========================================

-- D'abord supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.admin_get_all_users(TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.admin_get_all_users(
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  role TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Accès refusé: vous devez être administrateur';
  END IF;

  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email::TEXT as email,
    COALESCE(au.raw_user_meta_data->>'first_name', '')::TEXT as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '')::TEXT as last_name,
    COALESCE(us.phone, '')::TEXT as phone,
    COALESCE(us.city, '')::TEXT as city,
    COALESCE(ur.role, 'client')::TEXT as role,
    COALESCE(ur.is_admin, false) as is_admin,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_settings us ON us.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE (
    p_search IS NULL 
    OR p_search = ''
    OR au.email ILIKE '%' || p_search || '%'
    OR COALESCE(au.raw_user_meta_data->>'first_name', '') ILIKE '%' || p_search || '%'
    OR COALESCE(au.raw_user_meta_data->>'last_name', '') ILIKE '%' || p_search || '%'
    OR COALESCE(us.city, '') ILIKE '%' || p_search || '%'
  )
  ORDER BY au.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.admin_get_all_users(TEXT, INT, INT) TO authenticated;

-- ========================================
-- 2. FONCTION: COMPTER LES UTILISATEURS
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_count_users(
  p_search TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Accès refusé: vous devez être administrateur';
  END IF;

  SELECT COUNT(*)::INT INTO v_count
  FROM auth.users au
  LEFT JOIN public.user_settings us ON us.user_id = au.id
  WHERE (
    p_search IS NULL 
    OR au.email ILIKE '%' || p_search || '%'
    OR (au.raw_user_meta_data->>'first_name') ILIKE '%' || p_search || '%'
    OR (au.raw_user_meta_data->>'last_name') ILIKE '%' || p_search || '%'
    OR us.city ILIKE '%' || p_search || '%'
  );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_count_users(TEXT) TO authenticated;

-- ========================================
-- 3. FONCTION: MODIFIER LE RÔLE D'UN USER
-- ========================================

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

  -- Mettre à jour ou insérer le rôle
  INSERT INTO public.user_roles (user_id, role, is_admin)
  VALUES (
    p_user_id, 
    COALESCE(p_role, 'client'), 
    COALESCE(p_is_admin, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(p_role, user_roles.role),
    is_admin = COALESCE(p_is_admin, user_roles.is_admin),
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT, BOOLEAN) TO authenticated;

-- ========================================
-- 4. FONCTION: SUPPRIMER UN UTILISATEUR
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id UUID
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

  -- Empêcher un admin de se supprimer lui-même
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas supprimer votre propre compte depuis l''admin';
  END IF;

  -- Supprimer l'utilisateur (les cascades s'occupent du reste)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- ========================================
-- 5. FONCTION: STATISTIQUES ADMIN
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS TABLE (
  total_users INT,
  total_clients INT,
  total_prestataires INT,
  total_admins INT,
  users_this_week INT
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Accès refusé: vous devez être administrateur';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INT FROM auth.users) as total_users,
    (SELECT COUNT(*)::INT FROM public.user_roles WHERE role = 'client' OR role IS NULL) as total_clients,
    (SELECT COUNT(*)::INT FROM public.user_roles WHERE role = 'prestataire') as total_prestataires,
    (SELECT COUNT(*)::INT FROM public.user_roles WHERE is_admin = true) as total_admins,
    (SELECT COUNT(*)::INT FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days') as users_this_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;

-- ========================================
-- VÉRIFICATION
-- ========================================

SELECT '✅ Fonctions admin créées avec succès!' as resultat;
