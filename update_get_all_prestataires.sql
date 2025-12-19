-- Script pour mettre à jour la fonction get_all_prestataires
-- avec le nouveau type de retour (service_categories array)

-- 1. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.get_all_prestataires();

-- 2. Créer la nouvelle version avec service_categories (array)
CREATE OR REPLACE FUNCTION public.get_all_prestataires()
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  company_name text,
  service_categories text[],
  city text,
  average_rating decimal,
  total_reviews integer,
  total_services integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.user_id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    (au.raw_user_meta_data->>'company_name')::text as company_name,
    -- Gérer à la fois l'ancien format (string) et le nouveau (array)
    CASE
      -- Nouveau format : array JSON
      WHEN au.raw_user_meta_data->'service_categories' IS NOT NULL
           AND jsonb_typeof(au.raw_user_meta_data->'service_categories') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'service_categories'))
      -- Ancien format : string simple
      WHEN au.raw_user_meta_data->>'service_category' IS NOT NULL
           AND au.raw_user_meta_data->>'service_category' != ''
      THEN ARRAY[au.raw_user_meta_data->>'service_category']
      -- Cas par défaut : array vide
      ELSE ARRAY[]::text[]
    END as service_categories,
    us.city::text,
    COALESCE(ps.average_rating, 0) as average_rating,
    COALESCE(ps.total_reviews, 0) as total_reviews,
    COALESCE(ps.total_services, 0) as total_services
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.user_settings us ON us.user_id = ur.user_id
  LEFT JOIN public.prestataire_stats ps ON ps.user_id = ur.user_id
  WHERE ur.role = 'prestataire'
  ORDER BY ps.average_rating DESC NULLS LAST, ps.total_reviews DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_all_prestataires() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_prestataires() TO anon;

-- 4. Tester la fonction
SELECT * FROM public.get_all_prestataires();

SELECT '✅ Fonction get_all_prestataires mise à jour avec succès!' as resultat;
