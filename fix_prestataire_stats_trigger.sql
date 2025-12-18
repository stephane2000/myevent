-- Fix: Trigger pour mettre à jour automatiquement prestataire_stats
-- Ce trigger se déclenche quand on ajoute/modifie/supprime un service

-- Fonction pour recalculer les stats d'un prestataire
CREATE OR REPLACE FUNCTION update_prestataire_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer les nouvelles stats pour le prestataire concerné
  INSERT INTO public.prestataire_stats (user_id, total_services, average_rating, total_reviews)
  SELECT
    COALESCE(NEW.user_id, OLD.user_id) as user_id,
    COUNT(ps.id) as total_services,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
  FROM public.prestataire_services ps
  LEFT JOIN public.reviews r ON r.prestataire_id = ps.user_id
  WHERE ps.user_id = COALESCE(NEW.user_id, OLD.user_id)
  GROUP BY ps.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_services = EXCLUDED.total_services,
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_update_stats_on_service_insert ON public.prestataire_services;
DROP TRIGGER IF EXISTS trigger_update_stats_on_service_update ON public.prestataire_services;
DROP TRIGGER IF EXISTS trigger_update_stats_on_service_delete ON public.prestataire_services;

CREATE TRIGGER trigger_update_stats_on_service_insert
  AFTER INSERT ON public.prestataire_services
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_stats();

CREATE TRIGGER trigger_update_stats_on_service_update
  AFTER UPDATE ON public.prestataire_services
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_stats();

CREATE TRIGGER trigger_update_stats_on_service_delete
  AFTER DELETE ON public.prestataire_services
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_stats();

-- Recalculer toutes les stats existantes
INSERT INTO public.prestataire_stats (user_id, total_services, average_rating, total_reviews)
SELECT
  ps.user_id,
  COUNT(DISTINCT ps.id) as total_services,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews
FROM public.prestataire_services ps
LEFT JOIN public.reviews r ON r.prestataire_id = ps.user_id
GROUP BY ps.user_id
ON CONFLICT (user_id)
DO UPDATE SET
  total_services = EXCLUDED.total_services,
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  updated_at = now();

SELECT '✅ Triggers de stats créés et stats recalculées!' as resultat;
