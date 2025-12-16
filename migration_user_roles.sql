-- Script de migration de la table admins vers user_roles
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Créer le type ENUM s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('client', 'prestataire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Si la table user_roles existe déjà sans colonne role, on la supprime et recrée
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 3. Créer la table user_roles avec la bonne structure
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'client',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- 4. Migrer les données existantes de admins vers user_roles (si la table admins existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    INSERT INTO public.user_roles (user_id, role, is_admin, created_at, updated_at)
    SELECT 
      user_id, 
      'client'::user_role_type as role,
      is_admin,
      created_at,
      updated_at
    FROM public.admins
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 5. Activer RLS sur la nouvelle table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes policies si elles existent (seulement si la table admins existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    DROP POLICY IF EXISTS "Anyone can read admins" ON public.admins;
    DROP POLICY IF EXISTS "Only admins can update admins" ON public.admins;
  END IF;
END $$;

-- 7. Créer les nouvelles policies
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
CREATE POLICY "Users can update their own role"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('client', 'prestataire')
    AND is_admin = (SELECT is_admin FROM public.user_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage admin status" ON public.user_roles;
CREATE POLICY "Only admins can manage admin status"
  ON public.user_roles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE is_admin = true
    )
  );

-- 8. SUPPRIMER les anciens triggers
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();
DROP FUNCTION IF EXISTS public.handle_new_user_admin();

-- Note: L'insertion du rôle sera gérée manuellement dans l'application
-- lors de l'inscription pour permettre de choisir le rôle

-- 10. Créer les index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_admin ON public.user_roles(is_admin);

-- 11. Créer les fonctions utilitaires
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid)
RETURNS user_role_type AS $$
DECLARE
  user_role user_role_type;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_prestataire(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'prestataire'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. (OPTIONNEL) Supprimer l'ancienne table admins après vérification
-- ATTENTION : Décommenter uniquement après avoir vérifié que tout fonctionne !
-- DROP TABLE IF EXISTS public.admins CASCADE;

-- 13. Afficher un résumé de la migration
SELECT 
  'Migration terminée!' as status,
  COUNT(*) as total_users,
  SUM(CASE WHEN is_admin = true THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as clients,
  SUM(CASE WHEN role = 'prestataire' THEN 1 ELSE 0 END) as prestataires
FROM public.user_roles;
