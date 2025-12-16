-- Script pour corriger les policies RLS de la table admins
-- Exécutez ce script dans Supabase SQL Editor

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Anyone can read admins" ON public.admins;
DROP POLICY IF EXISTS "Only admins can update admins" ON public.admins;

-- Créer une policy de lecture publique (obligatoire pour que l'app puisse vérifier)
CREATE POLICY "Enable read access for all users"
  ON public.admins
  FOR SELECT
  TO public
  USING (true);

-- Créer une policy pour que seuls les admins puissent modifier
CREATE POLICY "Enable insert for authenticated users only"
  ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for admins only"
  ON public.admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );
