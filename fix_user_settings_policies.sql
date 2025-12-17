-- Fix des policies RLS pour user_settings (éviter récursion infinie)
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. SUPPRIMER LES POLICIES EXISTANTES
-- ========================================

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Admins can read all settings" ON public.user_settings;

-- ========================================
-- 2. CRÉER DES POLICIES SIMPLES SANS RÉCURSION
-- ========================================

-- Lecture: Chacun peut lire ses propres paramètres
CREATE POLICY "user_settings_select_own"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertion: Chacun peut créer ses propres paramètres
CREATE POLICY "user_settings_insert_own"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour: Chacun peut modifier ses propres paramètres
CREATE POLICY "user_settings_update_own"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Suppression: Chacun peut supprimer ses propres paramètres
CREATE POLICY "user_settings_delete_own"
  ON public.user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ========================================
-- 3. VÉRIFICATION
-- ========================================

SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'user_settings'
ORDER BY policyname;

SELECT '✅ Policies user_settings corrigées (sans récursion)!' as resultat;
