-- Script de diagnostic et correction complète des policies RLS
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. DIAGNOSTIC: Voir les policies actuelles
-- ========================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- ========================================
-- 2. NETTOYAGE COMPLET DES POLICIES
-- ========================================

-- Supprimer TOUTES les policies existantes (même celles qu'on ne connaît pas)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_record.policyname);
  END LOOP;
END $$;

-- ========================================
-- 3. VÉRIFIER QUE RLS EST ACTIVÉ
-- ========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CRÉER UNE POLICY TRÈS PERMISSIVE POUR TESTER
-- ========================================

-- Policy 1: Lecture totale pour TOUS (anon et authenticated)
CREATE POLICY "user_roles_select_all"
  ON public.user_roles
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Insert pour authenticated users seulement sur leur propre ligne
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Update pour users sur leur propre ligne (sans changer is_admin)
CREATE POLICY "user_roles_update_own"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin = (SELECT is_admin FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Policy 4: Admins peuvent tout faire
CREATE POLICY "user_roles_admin_all"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- 5. VÉRIFICATION FINALE
-- ========================================

-- Afficher les nouvelles policies
SELECT
  policyname,
  cmd as operation,
  roles,
  CASE
    WHEN qual::text = 'true' THEN 'Tous'
    ELSE 'Conditionnel'
  END as access_level
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Vérifier que la table est accessible
SELECT
  'user_roles est lisible!' as status,
  COUNT(*) as nombre_utilisateurs
FROM public.user_roles;

SELECT '✅ Policies RLS recréées avec succès!' as resultat;
