-- Script SQL à exécuter dans Supabase pour ajouter automatiquement is_admin aux nouveaux utilisateurs
-- Allez dans Supabase Dashboard > SQL Editor et exécutez ce script

-- Fonction qui ajoute is_admin = false aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ajouter is_admin = false dans les métadonnées de l'utilisateur
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'false'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger qui s'exécute AVANT l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Pour vérifier que ça fonctionne, vous pouvez exécuter :
-- SELECT id, email, raw_user_meta_data FROM auth.users;
