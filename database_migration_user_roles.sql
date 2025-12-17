-- Script de migration complet pour la gestion des rôles utilisateurs
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. NETTOYAGE COMPLET
-- ========================================

-- Supprimer les anciennes tables et types
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;

-- Supprimer les anciens triggers et fonctions
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_prestataire(uuid) CASCADE;

-- ========================================
-- 2. CRÉATION DU TYPE ENUM
-- ========================================

CREATE TYPE user_role_type AS ENUM ('client', 'prestataire');

-- ========================================
-- 3. CRÉATION DE LA TABLE user_roles
-- ========================================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'client',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- ========================================
-- 4. CRÉER LA FONCTION TRIGGER (AVANT RLS)
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Récupérer le rôle depuis les métadonnées utilisateur (défini lors de l'inscription)
  INSERT INTO public.user_roles (user_id, role, is_admin)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role_type, 'client'::user_role_type),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. CRÉER LE TRIGGER
-- ========================================

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- ========================================
-- 6. ACTIVER RLS
-- ========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CRÉER LES POLICIES RLS
-- ========================================

-- Permettre à tout le monde de lire
CREATE POLICY "Allow public read access"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- Permettre l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Permettre la mise à jour du rôle seulement
CREATE POLICY "Allow users to update their own role"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin = (SELECT is_admin FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Permettre aux admins de tout gérer
CREATE POLICY "Allow admins full access"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- 8. CRÉER LES INDEX
-- ========================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_is_admin ON public.user_roles(is_admin);

-- ========================================
-- 9. CRÉER LES FONCTIONS UTILITAIRES
-- ========================================

CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid)
RETURNS user_role_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role_type;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id;
  RETURN COALESCE(user_role, 'client'::user_role_type);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_prestataire(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'prestataire'
  );
END;
$$;

-- ========================================
-- 10. RÉSUMÉ
-- ========================================

SELECT
  'Migration terminée avec succès!' as status,
  'La table user_roles a été créée' as info,
  'Les triggers sont actifs pour les nouveaux utilisateurs' as trigger_status;
