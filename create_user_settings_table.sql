-- Création de la table user_settings pour stocker les préférences utilisateur
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. CRÉATION DE LA TABLE user_settings
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Paramètres de profil
  phone varchar(20),
  address text,
  city varchar(100),
  postal_code varchar(10),
  bio text,

  -- Paramètres de notification
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,

  -- Paramètres de confidentialité
  profile_visibility varchar(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'contacts')),
  show_email boolean DEFAULT false,
  show_phone boolean DEFAULT false,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(user_id)
);

-- ========================================
-- 2. ACTIVER RLS
-- ========================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CRÉER LES POLICIES RLS
-- ========================================

-- Lecture: Chacun peut lire ses propres paramètres
CREATE POLICY "Users can read own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertion: Chacun peut créer ses propres paramètres
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour: Chacun peut modifier ses propres paramètres
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins peuvent tout voir
CREATE POLICY "Admins can read all settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- 4. CRÉER LES INDEX
-- ========================================

CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- ========================================
-- 5. FONCTION TRIGGER POUR CRÉER LES PARAMÈTRES PAR DÉFAUT
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer les paramètres par défaut pour le nouvel utilisateur
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- ========================================
-- 6. FONCTION POUR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_updated
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- 7. VÉRIFICATION
-- ========================================

SELECT '✅ Table user_settings créée avec succès!' as resultat;
