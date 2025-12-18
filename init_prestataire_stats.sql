-- Initialiser les stats pour tous les prestataires
-- Même ceux qui n'ont pas encore de services

-- Insérer une ligne de stats pour chaque prestataire qui n'en a pas
INSERT INTO public.prestataire_stats (user_id, total_services, average_rating, total_reviews)
SELECT
  ur.user_id,
  0 as total_services,
  0 as average_rating,
  0 as total_reviews
FROM public.user_roles ur
WHERE ur.role = 'prestataire'
  AND NOT EXISTS (
    SELECT 1 FROM public.prestataire_stats ps WHERE ps.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Mettre à jour les stats pour ceux qui ont des services
UPDATE public.prestataire_stats ps
SET
  total_services = (
    SELECT COUNT(*) FROM public.prestataire_services prs WHERE prs.user_id = ps.user_id
  ),
  average_rating = COALESCE((
    SELECT AVG(rating) FROM public.reviews r WHERE r.prestataire_id = ps.user_id
  ), 0),
  total_reviews = (
    SELECT COUNT(*) FROM public.reviews r WHERE r.prestataire_id = ps.user_id
  ),
  updated_at = now()
WHERE ps.user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'prestataire'
);

SELECT '✅ Stats initialisées pour tous les prestataires!' as resultat;

-- Afficher le résultat
SELECT
  ur.user_id,
  ps.total_services,
  ps.average_rating,
  ps.total_reviews
FROM public.user_roles ur
LEFT JOIN public.prestataire_stats ps ON ps.user_id = ur.user_id
WHERE ur.role = 'prestataire'
ORDER BY ps.total_services DESC;
