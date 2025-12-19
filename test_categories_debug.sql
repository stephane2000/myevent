-- Script de debug pour voir ce qui est stocké dans les métadonnées

-- Voir les données brutes des prestataires
SELECT
  ur.user_id,
  au.email,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'service_category' as old_format,
  au.raw_user_meta_data->'service_categories' as new_format,
  au.raw_user_meta_data as all_metadata
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'prestataire';

-- Tester la fonction get_all_prestataires
SELECT * FROM public.get_all_prestataires();
