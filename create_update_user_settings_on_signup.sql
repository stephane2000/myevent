-- Fonction pour mettre à jour user_settings lors de l'inscription
-- Cette fonction bypass RLS car elle est SECURITY DEFINER
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. CRÉER LA FONCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.update_user_settings_on_signup(
  p_user_id UUID,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Mettre à jour user_settings (bypass RLS avec SECURITY DEFINER)
  UPDATE public.user_settings
  SET
    phone = p_phone,
    address = p_address,
    city = p_city,
    postal_code = p_postal_code,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Si aucune ligne n'a été mise à jour, créer l'enregistrement
  IF NOT FOUND THEN
    INSERT INTO public.user_settings (user_id, phone, address, city, postal_code)
    VALUES (p_user_id, p_phone, p_address, p_city, p_postal_code);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. DONNER LES PERMISSIONS
-- ========================================

-- Permettre aux utilisateurs authentifiés ET anonymes d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.update_user_settings_on_signup(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_settings_on_signup(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ========================================
-- 3. VÉRIFICATION
-- ========================================

SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname = 'update_user_settings_on_signup';

SELECT '✅ Fonction update_user_settings_on_signup créée avec succès!' as resultat;
