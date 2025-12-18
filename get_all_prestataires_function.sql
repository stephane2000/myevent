-- Fonction pour récupérer tous les prestataires avec leurs infos
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.get_all_prestataires()
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  company_name text,
  service_category text,
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
    (au.raw_user_meta_data->>'service_category')::text as service_category,
    us.city,
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

GRANT EXECUTE ON FUNCTION public.get_all_prestataires() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_prestataires() TO anon;

SELECT '✅ Fonction get_all_prestataires créée!' as resultat;
