-- Mise à jour du système d'activité: limite à 5 actions + nettoyage auto
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. FONCTION DE NETTOYAGE AUTOMATIQUE
-- ========================================

CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les activités de plus d'une semaine
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Garder seulement les 5 dernières activités par utilisateur
  DELETE FROM public.activity_log
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.activity_log
    ) sub
    WHERE rn > 5
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. TRIGGER APRÈS CHAQUE INSERTION
-- ========================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_cleanup_activity_logs ON public.activity_log;

-- Créer le trigger qui nettoie après chaque insertion
CREATE TRIGGER trigger_cleanup_activity_logs
  AFTER INSERT ON public.activity_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_activity_logs();

-- ========================================
-- 3. METTRE À JOUR LA FONCTION get_user_activity
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_activity(
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  action_description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action_type,
    al.action_description,
    al.metadata,
    al.created_at
  FROM public.activity_log al
  WHERE al.user_id = auth.uid()
  ORDER BY al.created_at DESC
  LIMIT LEAST(p_limit, 5);  -- Maximum 5 activités
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. NETTOYAGE IMMÉDIAT DES ANCIENNES DONNÉES
-- ========================================

-- Supprimer les activités de plus d'une semaine
DELETE FROM public.activity_log
WHERE created_at < NOW() - INTERVAL '7 days';

-- Garder seulement les 5 dernières activités par utilisateur
DELETE FROM public.activity_log
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.activity_log
  ) sub
  WHERE rn > 5
);

-- ========================================
-- 5. VÉRIFICATION
-- ========================================

-- Vérifier le nombre d'activités par utilisateur (max 5)
SELECT
  user_id,
  COUNT(*) as nombre_activites,
  MAX(created_at) as derniere_activite,
  MIN(created_at) as premiere_activite
FROM public.activity_log
GROUP BY user_id
ORDER BY nombre_activites DESC;

SELECT '✅ Système de nettoyage automatique activé!' as resultat;
SELECT '✅ Maximum 5 activités par utilisateur' as info1;
SELECT '✅ Suppression auto après 7 jours' as info2;
