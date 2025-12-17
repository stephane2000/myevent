# Guide de Migration - Système de Rôles

## ⚠️ IMPORTANT - À FAIRE MAINTENANT

Tu as l'erreur "Database error saving new user" parce que le script SQL n'est pas encore exécuté dans Supabase.

## 📋 Étapes à suivre (dans l'ordre):

### 1. Ouvrir Supabase Dashboard
- Va sur https://supabase.com/dashboard
- Sélectionne ton projet MyEvent

### 2. Aller dans l'éditeur SQL
- Dans le menu de gauche, clique sur **SQL Editor**
- Clique sur **New query**

### 3. Exécuter le script de migration
- Copie **TOUT** le contenu du fichier `database_migration_user_roles.sql`
- Colle-le dans l'éditeur SQL
- Clique sur **Run** (ou appuie sur Ctrl+Enter)

### 4. Vérifier que ça a marché
Tu devrais voir un message de succès avec:
```
status: Migration terminée avec succès!
info: La table user_roles a été créée
trigger_status: Les triggers sont actifs pour les nouveaux utilisateurs
```

### 5. Vérifier la table
- Va dans **Table Editor** (menu de gauche)
- Tu devrais voir une nouvelle table `user_roles`
- L'ancienne table `admins` a été supprimée

## ✅ Après la migration

Une fois le script exécuté:
1. Rafraîchis ton app (F5)
2. Essaie de créer un nouveau compte
3. Choisis "Client" ou "Prestataire"
4. L'inscription devrait marcher sans erreur!

## 🔍 Si tu veux vérifier qu'un utilisateur a bien son rôle

Dans SQL Editor, exécute:
```sql
SELECT
  u.email,
  r.role,
  r.is_admin
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
ORDER BY u.created_at DESC
LIMIT 10;
```

## 🚨 Si ça ne marche toujours pas

Vérifie dans **Logs** (menu de gauche):
1. Va dans **Logs**
2. Sélectionne **Postgres Logs**
3. Regarde s'il y a des erreurs

## 📝 Ce que fait le script

- ✅ Nettoie les anciennes tables et triggers
- ✅ Crée la table `user_roles` avec les colonnes: user_id, role (client/prestataire), is_admin
- ✅ Configure un trigger qui crée automatiquement le rôle quand un user s'inscrit
- ✅ Met en place les permissions RLS (Row Level Security)
- ✅ Crée des fonctions utilitaires pour vérifier les rôles
