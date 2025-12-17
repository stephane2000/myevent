-- Table pour l'historique d'activité utilisateur
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- 1. CRÉER LA TABLE activity_log
-- ========================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_action_type_idx ON public.activity_log(action_type);

-- ========================================
-- 2. ACTIVER RLS (Row Level Security)
-- ========================================

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CRÉER LES POLICIES RLS
-- ========================================

-- Lecture: Chacun peut lire son propre historique
CREATE POLICY "activity_log_select_own"
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertion: Chacun peut créer ses propres logs
CREATE POLICY "activity_log_insert_own"
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 4. FONCTION HELPER POUR LOGGER UNE ACTION
-- ========================================

CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_action_type TEXT,
  p_action_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_log (user_id, action_type, action_description, metadata)
  VALUES (auth.uid(), p_action_type, p_action_description, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.log_user_activity(TEXT, TEXT, JSONB) TO authenticated;

-- ========================================
-- 5. FONCTION POUR RÉCUPÉRER L'HISTORIQUE
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_activity(
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  action_description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action_type,
    al.action_description,
    al.metadata,
    al.created_at
  FROM public.activity_log al
  WHERE al.user_id = auth.uid()
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_activity(INT) TO authenticated;

-- ========================================
-- 6. TRIGGER POUR LOGGER LA CRÉATION DE COMPTE
-- ========================================

CREATE OR REPLACE FUNCTION public.log_account_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action_type, action_description, metadata)
  VALUES (
    NEW.id,
    'account_created',
    'Compte créé avec succès',
    jsonb_build_object('email', NEW.email)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created_log ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created_log
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_account_creation();

-- ========================================
-- 7. VÉRIFICATION
-- ========================================

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'activity_log';

SELECT '✅ Table activity_log créée avec succès!' as resultat;

-- ========================================
-- TYPES D'ACTIONS DISPONIBLES
-- ========================================

-- Types d'actions à utiliser dans l'application:
-- 'account_created'        - Création de compte
-- 'profile_updated'        - Modification du profil (nom, téléphone, adresse)
-- 'password_changed'       - Changement de mot de passe
-- 'message_received'       - Nouveau message reçu
-- 'message_sent'           - Nouveau message envoyé
-- 'listing_created'        - Nouvelle annonce postée
-- 'service_created'        - Nouveau service posté
-- 'listing_updated'        - Annonce modifiée
-- 'service_updated'        - Service modifié
