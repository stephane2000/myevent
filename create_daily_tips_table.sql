-- Table pour les conseils du jour
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. CRÉER LA TABLE daily_tips
-- ========================================

CREATE TABLE IF NOT EXISTS public.daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_text TEXT NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('client', 'prestataire', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. ACTIVER RLS (Row Level Security)
-- ========================================

ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CRÉER LES POLICIES RLS
-- ========================================

-- Lecture: Tous les utilisateurs authentifiés peuvent lire les conseils
CREATE POLICY "daily_tips_select_all"
  ON public.daily_tips
  FOR SELECT
  TO authenticated
  USING (true);

-- ========================================
-- 4. FONCTION POUR OBTENIR LE CONSEIL DU JOUR
-- ========================================

CREATE OR REPLACE FUNCTION public.get_daily_tip(p_role TEXT)
RETURNS TABLE (
  id UUID,
  tip_text TEXT
) AS $$
DECLARE
  v_day_of_year INT;
  v_total_tips INT;
  v_tip_index INT;
BEGIN
  -- Calculer le jour de l'année (1-365/366)
  v_day_of_year := EXTRACT(DOY FROM CURRENT_DATE);

  -- Compter le nombre total de conseils pour ce rôle
  SELECT COUNT(*) INTO v_total_tips
  FROM public.daily_tips
  WHERE target_role = p_role OR target_role = 'both';

  -- Si aucun conseil, retourner vide
  IF v_total_tips = 0 THEN
    RETURN;
  END IF;

  -- Calculer l'index du conseil (rotation basée sur le jour de l'année)
  v_tip_index := (v_day_of_year % v_total_tips);

  -- Retourner le conseil du jour
  RETURN QUERY
  SELECT dt.id, dt.tip_text
  FROM public.daily_tips dt
  WHERE dt.target_role = p_role OR dt.target_role = 'both'
  ORDER BY dt.created_at
  LIMIT 1 OFFSET v_tip_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_daily_tip(TEXT) TO authenticated;

-- ========================================
-- 5. INSÉRER 15 CONSEILS VARIÉS
-- ========================================

INSERT INTO public.daily_tips (tip_text, target_role) VALUES
-- Conseils pour clients
('Définissez clairement votre budget et vos attentes avant de contacter un prestataire pour gagner du temps.', 'client'),
('N''hésitez pas à demander plusieurs devis pour comparer les offres et choisir celle qui vous convient le mieux.', 'client'),
('Vérifiez les avis et références des prestataires avant de prendre votre décision finale.', 'client'),
('Prévoyez une marge de sécurité dans votre planning : les imprévus arrivent plus souvent qu''on ne le pense !', 'client'),
('Communiquez régulièrement avec votre prestataire pour éviter les malentendus et assurer le succès de votre événement.', 'client'),

-- Conseils pour prestataires
('Mettez à jour régulièrement votre portfolio avec vos dernières réalisations pour attirer plus de clients.', 'prestataire'),
('Répondez rapidement aux demandes des clients : la réactivité est un critère clé dans leur choix.', 'prestataire'),
('Détaillez clairement vos prestations et tarifs pour éviter les malentendus avec vos clients.', 'prestataire'),
('Demandez des avis à vos clients satisfaits : les témoignages positifs sont votre meilleur atout marketing.', 'prestataire'),
('Restez professionnel dans toutes vos communications, même face à des demandes inhabituelles.', 'prestataire'),

-- Conseils pour tous
('Un contrat clair protège à la fois le client et le prestataire : ne négligez jamais cette étape.', 'both'),
('La transparence est la clé d''une collaboration réussie : communiquez ouvertement sur vos contraintes.', 'both'),
('Anticipez les besoins en amont : une bonne préparation permet d''éviter 90% des problèmes.', 'both'),
('N''oubliez pas de valider les détails logistiques : lieu, horaires, matériel nécessaire...', 'both'),
('Gardez toujours une trace écrite de vos échanges importants pour éviter les litiges futurs.', 'both');

-- ========================================
-- 6. VÉRIFICATION
-- ========================================

SELECT COUNT(*) as nombre_conseils, target_role
FROM public.daily_tips
GROUP BY target_role;

SELECT '✅ Table daily_tips créée avec 15 conseils!' as resultat;
