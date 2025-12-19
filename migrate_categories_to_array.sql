-- Script pour migrer service_category (string) vers service_categories (array)
-- À exécuter si tu veux convertir les anciens comptes

-- Voir combien de prestataires ont l'ancien format
SELECT COUNT(*) as prestataires_ancien_format
FROM auth.users au
WHERE au.raw_user_meta_data->>'service_category' IS NOT NULL
  AND au.raw_user_meta_data->'service_categories' IS NULL;

-- MIGRATION : Convertir tous les prestataires de l'ancien au nouveau format
-- ⚠️ ATTENTION : Cette migration modifie directement auth.users
-- Exécuter seulement si nécessaire

DO $$
DECLARE
  user_record RECORD;
  old_category text;
  new_metadata jsonb;
BEGIN
  -- Pour chaque utilisateur avec l'ancien format
  FOR user_record IN
    SELECT id, raw_user_meta_data
    FROM auth.users
    WHERE raw_user_meta_data->>'service_category' IS NOT NULL
      AND raw_user_meta_data->'service_categories' IS NULL
  LOOP
    -- Récupérer l'ancienne catégorie
    old_category := user_record.raw_user_meta_data->>'service_category';

    -- Créer les nouvelles métadonnées avec service_categories en array
    new_metadata := user_record.raw_user_meta_data
                    - 'service_category'  -- Retirer l'ancien champ
                    || jsonb_build_object('service_categories', jsonb_build_array(old_category)); -- Ajouter le nouveau

    -- Mettre à jour l'utilisateur
    UPDATE auth.users
    SET raw_user_meta_data = new_metadata,
        updated_at = now()
    WHERE id = user_record.id;

    RAISE NOTICE 'Migré utilisateur % : % -> [%]', user_record.id, old_category, old_category;
  END LOOP;
END $$;

-- Vérifier le résultat
SELECT
  au.email,
  au.raw_user_meta_data->>'service_category' as old_format,
  au.raw_user_meta_data->'service_categories' as new_format
FROM auth.users au
JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.role = 'prestataire';

SELECT '✅ Migration terminée!' as resultat;
