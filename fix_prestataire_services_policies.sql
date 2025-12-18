-- Fix pour les policies de prestataire_services
-- Problème: infinite recursion avec la vérification du rôle dans user_roles
-- Solution: Simplifier les policies et retirer la vérification du rôle dans INSERT

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Tout le monde peut voir les services actifs" ON public.prestataire_services;
DROP POLICY IF EXISTS "Prestataires peuvent voir tous leurs services" ON public.prestataire_services;
DROP POLICY IF EXISTS "Prestataires peuvent créer leurs services" ON public.prestataire_services;
DROP POLICY IF EXISTS "Prestataires peuvent modifier leurs services" ON public.prestataire_services;
DROP POLICY IF EXISTS "Prestataires peuvent supprimer leurs services" ON public.prestataire_services;

-- Recréer les policies sans la vérification du rôle qui cause la récursion
CREATE POLICY "Tout le monde peut voir les services actifs"
  ON public.prestataire_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Prestataires peuvent voir tous leurs services"
  ON public.prestataire_services FOR SELECT
  USING (auth.uid() = user_id);

-- Policy simplifiée sans vérification du rôle (la vérification se fait côté application)
CREATE POLICY "Utilisateurs peuvent créer leurs services"
  ON public.prestataire_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs services"
  ON public.prestataire_services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs services"
  ON public.prestataire_services FOR DELETE
  USING (auth.uid() = user_id);

-- Note: La vérification du rôle prestataire est maintenant faite côté application
-- avant d'appeler la création de service, ce qui évite la récursion RLS

SELECT '✅ Policies de prestataire_services corrigées!' as resultat;
