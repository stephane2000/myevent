-- Script de débogage pour comprendre pourquoi /prestataires est vide
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier combien d'utilisateurs avec le rôle prestataire
SELECT COUNT(*) as nombre_prestataires
FROM public.user_roles
WHERE role = 'prestataire';

-- 2. Voir les prestataires et leurs infos
SELECT
  ur.user_id,
  ur.role,
  au.email,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'company_name' as company_name,
  au.raw_user_meta_data->>'service_category' as service_category
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'prestataire';

-- 3. Tester la fonction get_all_prestataires directement
SELECT * FROM public.get_all_prestataires();

-- 4. Vérifier les user_settings
SELECT user_id, city
FROM public.user_settings
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'prestataire'
);

-- 5. Vérifier les stats prestataires
SELECT user_id, average_rating, total_reviews, total_services
FROM public.prestataire_stats
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'prestataire'
);
