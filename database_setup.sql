-- Script SQL pour créer la table user_roles
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Créer un type ENUM pour les rôles d'utilisateur
-- Note: 'admin' est géré par le champ is_admin, pas par le rôle
CREATE TYPE user_role_type AS ENUM ('client', 'prestataire');

-- Créer la table user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'client',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent lire leur propre rôle
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent mettre à jour leur propre rôle (client/prestataire uniquement)
CREATE POLICY "Users can update their own role"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('client', 'prestataire')
    AND is_admin = (SELECT is_admin FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Policy : Les utilisateurs peuvent insérer leur propre rôle lors de l'inscription
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Seuls les admins peuvent modifier is_admin et tous les rôles
CREATE POLICY "Only admins can manage admin status"
  ON public.user_roles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE is_admin = true
    )
  );

-- Note: Pas de trigger automatique pour user_roles
-- L'insertion du rôle est gérée manuellement dans l'application
-- lors de l'inscription pour permettre à l'utilisateur de choisir son rôle

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_admin ON public.user_roles(is_admin);

-- Fonction utile pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le rôle d'un utilisateur
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

-- Fonction pour vérifier si un utilisateur est prestataire
CREATE OR REPLACE FUNCTION public.is_user_prestataire(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'prestataire'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
