-- Création d'une fonction sécurisée pour récupérer les paramètres utilisateur
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ========================================
-- FONCTION POUR RÉCUPÉRER user_settings
-- ========================================

-- Cette fonction bypass RLS de manière sécurisée
CREATE OR REPLACE FUNCTION public.get_current_user_settings()
RETURNS TABLE(
  phone varchar(20),
  address text,
  city varchar(100),
  postal_code varchar(10),
  bio text,
  email_notifications boolean,
  sms_notifications boolean,
  marketing_emails boolean,
  profile_visibility varchar(20),
  show_email boolean,
  show_phone boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.phone,
    us.address,
    us.city,
    us.postal_code,
    us.bio,
    us.email_notifications,
    us.sms_notifications,
    us.marketing_emails,
    us.profile_visibility,
    us.show_email,
    us.show_phone
  FROM public.user_settings us
  WHERE us.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_settings() TO anon;

-- Test de la fonction
SELECT * FROM public.get_current_user_settings();

SELECT '✅ Fonction get_current_user_settings() créée avec succès!' as resultat;
