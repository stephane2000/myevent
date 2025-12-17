-- Fix des policies RLS pour permettre la lecture
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Allow public read access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_roles;

-- Créer une policy de lecture simple pour TOUS (authentifiés ou non)
CREATE POLICY "Enable read for all"
  ON public.user_roles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Permettre l'insertion uniquement pour les utilisateurs authentifiés sur leur propre ligne
CREATE POLICY "Enable insert for authenticated users"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Permettre la mise à jour uniquement de son propre rôle (pas is_admin)
CREATE POLICY "Enable update for users"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin = (SELECT is_admin FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Permettre aux admins de tout faire
CREATE POLICY "Enable all for admins"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

SELECT 'Policies RLS corrigées!' as status;
