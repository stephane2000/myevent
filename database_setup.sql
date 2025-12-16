-- Script SQL pour créer la table admins
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Créer la table admins
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire la table admins
CREATE POLICY "Anyone can read admins"
  ON public.admins
  FOR SELECT
  USING (true);

-- Policy : Seuls les admins peuvent modifier la table
CREATE POLICY "Only admins can update admins"
  ON public.admins
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins WHERE is_admin = true
    )
  );

-- Créer un trigger pour ajouter automatiquement une entrée dans admins lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admins (user_id, is_admin)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_admin();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_admin ON public.admins(is_admin);

-- Fonction utile pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
