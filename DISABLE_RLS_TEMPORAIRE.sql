-- TEMPORAIRE: Désactiver RLS pour tester
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ⚠️ ATTENTION: Ceci est TEMPORAIRE pour diagnostiquer le problème

-- Désactiver RLS temporairement
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS désactivé temporairement - NE PAS LAISSER EN PRODUCTION!' as warning;
