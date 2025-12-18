-- ========================================
-- SYSTÈME COMPLET DE GESTION DES PRESTATAIRES
-- MyEvent - PrestaBase
-- ========================================

-- ========================================
-- 1. TABLE: SERVICES DES PRESTATAIRES
-- ========================================

CREATE TABLE IF NOT EXISTS public.prestataire_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text NOT NULL,
  category varchar(100) NOT NULL,
  price_type varchar(50) NOT NULL, -- 'fixed', 'hourly', 'daily', 'package', 'on_request'
  price_min decimal(10,2),
  price_max decimal(10,2),
  currency varchar(3) DEFAULT 'EUR',
  location_type varchar(50) NOT NULL, -- 'on_site', 'remote', 'both'
  service_area text[], -- Zones géographiques desservies
  duration_min integer, -- Durée minimale en minutes
  duration_max integer, -- Durée maximale en minutes
  capacity integer, -- Capacité (nombre de personnes max)
  images text[], -- URLs des images
  video_url text,
  tags text[],
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_prestataire_services_user_id ON public.prestataire_services(user_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_services_category ON public.prestataire_services(category);
CREATE INDEX IF NOT EXISTS idx_prestataire_services_is_active ON public.prestataire_services(is_active);
CREATE INDEX IF NOT EXISTS idx_prestataire_services_created_at ON public.prestataire_services(created_at DESC);

-- RLS Policies
ALTER TABLE public.prestataire_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les services actifs"
  ON public.prestataire_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Prestataires peuvent voir tous leurs services"
  ON public.prestataire_services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Prestataires peuvent créer leurs services"
  ON public.prestataire_services FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'prestataire'
    )
  );

CREATE POLICY "Prestataires peuvent modifier leurs services"
  ON public.prestataire_services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Prestataires peuvent supprimer leurs services"
  ON public.prestataire_services FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 2. TABLE: DISPONIBILITÉS DES PRESTATAIRES
-- ========================================

CREATE TABLE IF NOT EXISTS public.prestataire_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  time_slots jsonb, -- [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}]
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prestataire_availability_user_id ON public.prestataire_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_availability_date ON public.prestataire_availability(date);

ALTER TABLE public.prestataire_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les disponibilités"
  ON public.prestataire_availability FOR SELECT
  USING (true);

CREATE POLICY "Prestataires gèrent leurs disponibilités"
  ON public.prestataire_availability FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 3. TABLE: DEMANDES DE DEVIS / RÉSERVATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.prestataire_services(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prestataire_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  event_time time,
  event_duration integer, -- en minutes
  location text,
  guest_count integer,
  message text,
  budget_min decimal(10,2),
  budget_max decimal(10,2),
  status varchar(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled', 'completed'
  prestataire_response text,
  quoted_price decimal(10,2),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_service_id ON public.booking_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_client_id ON public.booking_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_prestataire_id ON public.booking_requests(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients voient leurs demandes"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Prestataires voient leurs demandes"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Clients créent des demandes"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Prestataires répondent aux demandes"
  ON public.booking_requests FOR UPDATE
  USING (auth.uid() = prestataire_id);

CREATE POLICY "Clients annulent leurs demandes"
  ON public.booking_requests FOR UPDATE
  USING (auth.uid() = client_id AND status = 'pending');

-- ========================================
-- 4. TABLE: AVIS ET NOTES
-- ========================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.prestataire_services(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title varchar(200),
  comment text,
  images text[],
  response_from_prestataire text,
  response_date timestamptz,
  is_verified boolean DEFAULT false, -- Si lié à une vraie réservation
  is_visible boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(client_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_prestataire_id ON public.reviews(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde voit les avis visibles"
  ON public.reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Clients créent des avis"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.booking_requests
      WHERE id = booking_id
      AND client_id = auth.uid()
      AND status = 'completed'
    )
  );

CREATE POLICY "Clients modifient leurs avis"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Prestataires répondent aux avis"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = prestataire_id);

-- ========================================
-- 5. TABLE: CONVERSATIONS / MESSAGERIE
-- ========================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  UNIQUE(participant_1, participant_2, booking_id),
  CHECK (participant_1 != participant_2)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants voient leurs conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Utilisateurs créent des conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Participants modifient leurs conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() IN (participant_1, participant_2));

-- ========================================
-- 6. TABLE: MESSAGES
-- ========================================

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments text[],
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants voient les messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1, participant_2)
    )
  );

CREATE POLICY "Participants envoient des messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1, participant_2)
    )
  );

CREATE POLICY "Participants marquent comme lu"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1, participant_2)
    )
  );

-- ========================================
-- 7. TABLE: STATISTIQUES PRESTATAIRES
-- ========================================

CREATE TABLE IF NOT EXISTS public.prestataire_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_services integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0,
  response_rate decimal(5,2) DEFAULT 0, -- Pourcentage
  response_time_hours integer DEFAULT 0, -- Temps moyen de réponse
  completion_rate decimal(5,2) DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  profile_views integer DEFAULT 0,
  service_views integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.prestataire_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde voit les stats publiques"
  ON public.prestataire_stats FOR SELECT
  USING (true);

CREATE POLICY "Prestataires modifient leurs stats"
  ON public.prestataire_stats FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 8. FONCTIONS UTILES
-- ========================================

-- Fonction: Obtenir les services d'un prestataire
CREATE OR REPLACE FUNCTION public.get_prestataire_services(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title varchar,
  description text,
  category varchar,
  price_type varchar,
  price_min decimal,
  price_max decimal,
  images text[],
  is_active boolean,
  view_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id, ps.title, ps.description, ps.category, ps.price_type,
    ps.price_min, ps.price_max, ps.images, ps.is_active,
    ps.view_count, ps.created_at
  FROM public.prestataire_services ps
  WHERE ps.user_id = p_user_id
  ORDER BY ps.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Calculer la note moyenne d'un prestataire
CREATE OR REPLACE FUNCTION public.calculate_prestataire_rating(p_user_id uuid)
RETURNS decimal AS $$
DECLARE
  avg_rating decimal;
BEGIN
  SELECT COALESCE(AVG(rating), 0)::decimal(3,2)
  INTO avg_rating
  FROM public.reviews
  WHERE prestataire_id = p_user_id AND is_visible = true;

  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Obtenir les avis d'un prestataire
CREATE OR REPLACE FUNCTION public.get_prestataire_reviews(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  client_name text,
  rating integer,
  title varchar,
  comment text,
  response_from_prestataire text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    COALESCE(u.raw_user_meta_data->>'first_name', 'Anonyme') as client_name,
    r.rating, r.title, r.comment, r.response_from_prestataire, r.created_at
  FROM public.reviews r
  LEFT JOIN auth.users u ON u.id = r.client_id
  WHERE r.prestataire_id = p_user_id AND r.is_visible = true
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Obtenir les conversations d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  other_user_id uuid,
  other_user_name text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    CASE WHEN c.participant_1 = p_user_id THEN c.participant_2 ELSE c.participant_1 END as other_user_id,
    COALESCE(
      u.raw_user_meta_data->>'first_name' || ' ' || u.raw_user_meta_data->>'last_name',
      u.email
    ) as other_user_name,
    (SELECT content FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
    c.last_message_at,
    (SELECT COUNT(*) FROM public.messages WHERE conversation_id = c.id AND sender_id != p_user_id AND is_read = false) as unread_count
  FROM public.conversations c
  LEFT JOIN auth.users u ON u.id = CASE WHEN c.participant_1 = p_user_id THEN c.participant_2 ELSE c.participant_1 END
  WHERE p_user_id IN (c.participant_1, c.participant_2)
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Mettre à jour les statistiques d'un prestataire
CREATE OR REPLACE FUNCTION public.update_prestataire_stats(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_total_services integer;
  v_total_bookings integer;
  v_total_reviews integer;
  v_avg_rating decimal;
BEGIN
  -- Compter les services
  SELECT COUNT(*) INTO v_total_services
  FROM public.prestataire_services
  WHERE user_id = p_user_id;

  -- Compter les réservations
  SELECT COUNT(*) INTO v_total_bookings
  FROM public.booking_requests
  WHERE prestataire_id = p_user_id AND status IN ('accepted', 'completed');

  -- Compter les avis et calculer la moyenne
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_total_reviews, v_avg_rating
  FROM public.reviews
  WHERE prestataire_id = p_user_id AND is_visible = true;

  -- Upsert des stats
  INSERT INTO public.prestataire_stats (
    user_id, total_services, total_bookings, total_reviews, average_rating, updated_at
  )
  VALUES (
    p_user_id, v_total_services, v_total_bookings, v_total_reviews, v_avg_rating, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_services = v_total_services,
    total_bookings = v_total_bookings,
    total_reviews = v_total_reviews,
    average_rating = v_avg_rating,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. TRIGGERS POUR MISE À JOUR AUTO
-- ========================================

-- Trigger: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prestataire_services_updated_at
  BEFORE UPDATE ON public.prestataire_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Mettre à jour last_message_at dans conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Trigger: Mettre à jour les stats après un nouvel avis
CREATE OR REPLACE FUNCTION public.trigger_update_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_prestataire_stats(NEW.prestataire_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_stats_on_review();

-- ========================================
-- 10. DONNÉES INITIALES
-- ========================================

-- Catégories de services prédéfinies (pour référence)
-- Ces catégories correspondent à celles du register
-- 'DJ / Musique', 'Photographe', 'Vidéaste', 'Traiteur', 'Décorateur',
-- 'Animateur', 'Location de salle', 'Location de matériel',
-- 'Wedding planner', 'Fleuriste', 'Autre'

-- ========================================
-- PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- VÉRIFICATION
-- ========================================

SELECT '✅ Système complet de gestion des prestataires créé avec succès!' as resultat;
SELECT 'Tables: prestataire_services, prestataire_availability, booking_requests, reviews, conversations, messages, prestataire_stats' as tables_creees;
SELECT 'Fonctions: get_prestataire_services, calculate_prestataire_rating, get_prestataire_reviews, get_user_conversations, update_prestataire_stats' as fonctions_creees;
