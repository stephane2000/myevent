-- Créer un trigger pour auto-créer user_settings après inscription
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. SUPPRIMER LE TRIGGER ET LA FONCTION SI EXISTANTS
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ========================================
-- 2. CRÉER LA FONCTION QUI SERA APPELÉE PAR LE TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer automatiquement un enregistrement dans user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. CRÉER LE TRIGGER SUR auth.users
-- ========================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 4. VÉRIFICATION
-- ========================================

SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'on_auth_user_created';

SELECT '✅ Trigger user_settings créé avec succès!' as resultat;
