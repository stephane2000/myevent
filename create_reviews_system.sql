-- Système d'avis complet pour les prestataires
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Créer la table des avis
CREATE TABLE IF NOT EXISTS public.prestataire_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prestataire_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  response_from_prestataire text,
  response_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(prestataire_id, client_id) -- Un client ne peut laisser qu'un avis par prestataire
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_reviews_prestataire ON public.prestataire_reviews(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON public.prestataire_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.prestataire_reviews(rating);

-- Activer RLS
ALTER TABLE public.prestataire_reviews ENABLE ROW LEVEL SECURITY;

-- Policies pour les avis
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.prestataire_reviews;
CREATE POLICY "Anyone can view reviews" ON public.prestataire_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.prestataire_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.prestataire_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND 
    auth.uid() != prestataire_id -- Ne peut pas s'auto-évaluer
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.prestataire_reviews;
CREATE POLICY "Users can update their own reviews" ON public.prestataire_reviews
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = prestataire_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.prestataire_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.prestataire_reviews
  FOR DELETE USING (auth.uid() = client_id);

-- Fonction pour récupérer les avis d'un prestataire
DROP FUNCTION IF EXISTS public.get_prestataire_reviews(uuid, integer, integer);
CREATE OR REPLACE FUNCTION public.get_prestataire_reviews(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client_name text,
  rating integer,
  title text,
  comment text,
  response_from_prestataire text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.client_id,
    CONCAT(
      COALESCE(au.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    )::text as client_name,
    r.rating,
    r.title,
    r.comment,
    r.response_from_prestataire,
    r.created_at
  FROM public.prestataire_reviews r
  LEFT JOIN auth.users au ON au.id = r.client_id
  WHERE r.prestataire_id = p_user_id
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter un avis
DROP FUNCTION IF EXISTS public.add_review(uuid, integer, text, text);
CREATE OR REPLACE FUNCTION public.add_review(
  p_prestataire_id uuid,
  p_rating integer,
  p_title text DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_review_id uuid;
  v_client_id uuid;
BEGIN
  v_client_id := auth.uid();
  
  -- Vérifier que l'utilisateur ne s'auto-évalue pas
  IF v_client_id = p_prestataire_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas laisser un avis sur vous-même';
  END IF;
  
  -- Insérer l'avis
  INSERT INTO public.prestataire_reviews (prestataire_id, client_id, rating, title, comment)
  VALUES (p_prestataire_id, v_client_id, p_rating, p_title, p_comment)
  ON CONFLICT (prestataire_id, client_id) 
  DO UPDATE SET 
    rating = EXCLUDED.rating,
    title = EXCLUDED.title,
    comment = EXCLUDED.comment,
    updated_at = now()
  RETURNING id INTO v_review_id;
  
  -- Mettre à jour les stats du prestataire
  PERFORM update_prestataire_stats(p_prestataire_id);
  
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les stats d'un prestataire
DROP FUNCTION IF EXISTS public.update_prestataire_stats(uuid);
CREATE OR REPLACE FUNCTION public.update_prestataire_stats(p_prestataire_id uuid)
RETURNS void AS $$
DECLARE
  v_avg_rating decimal;
  v_total_reviews integer;
  v_total_services integer;
BEGIN
  -- Calculer la moyenne et le nombre d'avis
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_total_reviews
  FROM public.prestataire_reviews
  WHERE prestataire_id = p_prestataire_id;
  
  -- Compter les services
  SELECT COUNT(*) INTO v_total_services
  FROM public.prestataire_services
  WHERE user_id = p_prestataire_id AND is_active = true;
  
  -- Mettre à jour ou insérer les stats
  INSERT INTO public.prestataire_stats (user_id, average_rating, total_reviews, total_services)
  VALUES (p_prestataire_id, v_avg_rating, v_total_reviews, v_total_services)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    average_rating = v_avg_rating,
    total_reviews = v_total_reviews,
    total_services = v_total_services,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a déjà laissé un avis
DROP FUNCTION IF EXISTS public.has_user_reviewed(uuid);
CREATE OR REPLACE FUNCTION public.has_user_reviewed(p_prestataire_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.prestataire_reviews
    WHERE prestataire_id = p_prestataire_id AND client_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer l'avis d'un utilisateur sur un prestataire
DROP FUNCTION IF EXISTS public.get_user_review(uuid);
CREATE OR REPLACE FUNCTION public.get_user_review(p_prestataire_id uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  title text,
  comment text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.rating,
    r.title,
    r.comment,
    r.created_at
  FROM public.prestataire_reviews r
  WHERE r.prestataire_id = p_prestataire_id AND r.client_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_prestataire_reviews(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_prestataire_reviews(uuid, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.add_review(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_prestataire_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_reviewed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_review(uuid) TO authenticated;

SELECT '✅ Système d''avis configuré!' as resultat;
