-- Fonction pour créer ou récupérer une conversation entre deux utilisateurs
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Supprimer les anciennes tables si elles existent avec une structure différente
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Créer la table conversations
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Créer la table messages
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour les performances
CREATE INDEX idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- Activer RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies pour conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies pour messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages they received" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Fonction pour créer ou récupérer une conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user_id uuid,
  p_other_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Vérifier si une conversation existe déjà
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (user1_id = p_user_id AND user2_id = p_other_user_id)
     OR (user1_id = p_other_user_id AND user2_id = p_user_id)
  LIMIT 1;

  -- Si pas de conversation, en créer une
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id)
    VALUES (p_user_id, p_other_user_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les conversations d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  other_user_id uuid,
  other_user_name text,
  last_message text,
  last_message_at timestamp with time zone,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    CASE 
      WHEN c.user1_id = p_user_id THEN c.user2_id
      ELSE c.user1_id
    END as other_user_id,
    COALESCE(
      au.raw_user_meta_data->>'company_name',
      CONCAT(
        COALESCE(au.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(au.raw_user_meta_data->>'last_name', '')
      )
    )::text as other_user_name,
    (
      SELECT m.content
      FROM public.messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message,
    COALESCE(
      (
        SELECT m.created_at
        FROM public.messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ),
      c.created_at
    ) as last_message_at,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.is_read = false
    ) as unread_count
  FROM public.conversations c
  LEFT JOIN auth.users au ON au.id = CASE 
    WHEN c.user1_id = p_user_id THEN c.user2_id
    ELSE c.user1_id
  END
  WHERE c.user1_id = p_user_id OR c.user2_id = p_user_id
  ORDER BY last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid) TO authenticated;

SELECT '✅ Système de messagerie configuré!' as resultat;
