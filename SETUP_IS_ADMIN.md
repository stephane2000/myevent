# Configuration du champ is_admin - Instructions pas à pas

Le champ `is_admin` est maintenant géré automatiquement par Supabase via un trigger PostgreSQL. Voici comment l'activer :

## Étape 1 : Exécuter le script SQL dans Supabase

1. **Allez sur votre dashboard Supabase** : https://supabase.com/dashboard

2. **Sélectionnez votre projet MyEvent**

3. **Ouvrez le SQL Editor** :
   - Dans la barre latérale, cherchez **"SQL Editor"** ou **"Database"** > **"SQL Editor"**
   - Ou cliquez sur l'icône qui ressemble à `</>`

4. **Créez une nouvelle query** :
   - Cliquez sur **"New query"** ou le bouton `+`

5. **Copiez-collez le contenu du fichier `supabase_setup.sql`** :

```sql
-- Fonction qui ajoute is_admin = false aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ajouter is_admin = false dans les métadonnées de l'utilisateur
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'false'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger qui s'exécute AVANT l'insertion d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

6. **Cliquez sur "Run" ou "Execute"** (bouton en bas à droite)

7. **Vous devriez voir** :
   ```
   Success. No rows returned
   ```

✅ Le trigger est maintenant actif !

## Étape 2 : Tester avec un nouvel utilisateur

1. **Allez sur votre application** : https://domyevent.vercel.app/register

2. **Inscrivez un nouvel utilisateur** avec :
   - Prénom : Test
   - Email : test@example.com
   - Mot de passe : Test123!

3. **Vérifiez dans Supabase** :
   - Allez dans **Authentication** > **Users**
   - Cliquez sur l'utilisateur que vous venez de créer
   - Dans **User Metadata**, vous devriez voir :
   ```json
   {
     "first_name": "Test",
     "is_admin": false
   }
   ```

## Étape 3 : Ajouter is_admin aux utilisateurs existants

Si vous avez déjà des utilisateurs créés avant d'installer le trigger, ils n'ont pas le champ `is_admin`. Pour les ajouter :

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Authentication** > **Users**
2. Cliquez sur chaque utilisateur
3. Dans **User Metadata**, modifiez manuellement pour ajouter :
   ```json
   {
     "first_name": "Prénom",
     "is_admin": false
   }
   ```

### Option 2 : Via SQL (Plus rapide)

Exécutez cette requête dans le SQL Editor :

```sql
-- Ajouter is_admin = false à tous les utilisateurs qui ne l'ont pas
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'false'::jsonb
)
WHERE raw_user_meta_data->>'is_admin' IS NULL;
```

## Étape 4 : Promouvoir un utilisateur en admin

Pour rendre un utilisateur admin, suivez le guide dans [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).

En résumé :
1. **Authentication** > **Users**
2. Cliquez sur l'utilisateur
3. Modifiez **User Metadata** pour mettre `"is_admin": true`
4. L'utilisateur doit se déconnecter et se reconnecter

## Comment ça fonctionne ?

### Le Trigger PostgreSQL

Le trigger `on_auth_user_created` s'exécute **automatiquement** à chaque fois qu'un nouvel utilisateur est créé dans Supabase. Il ajoute `is_admin: false` dans les métadonnées AVANT que l'utilisateur soit enregistré dans la base de données.

### Avantages de cette approche

✅ **Pas de problème CORS** : L'ajout se fait côté serveur, pas depuis le client
✅ **Automatique** : Tous les nouveaux utilisateurs auront le champ
✅ **Sécurisé** : Le client ne peut pas se déclarer admin lors de l'inscription
✅ **Maintenu** : Même si vous changez le code frontend, le trigger reste actif

## Vérifier que le trigger fonctionne

Après avoir exécuté le script SQL, vérifiez :

```sql
-- Lister toutes les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- Lister tous les triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Vous devriez voir :
- Fonction : `handle_new_user`
- Trigger : `on_auth_user_created` sur la table `users`

## Supprimer le trigger (si nécessaire)

Si vous voulez désactiver cette fonctionnalité :

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

## Problèmes courants

### Le trigger ne s'exécute pas

**Solution** : Vérifiez que vous avez bien exécuté le script dans le bon projet Supabase.

### Les anciens utilisateurs n'ont pas is_admin

**Solution** : Exécutez la requête UPDATE dans l'Étape 3 pour ajouter le champ aux utilisateurs existants.

### L'utilisateur ne voit pas son badge admin

**Solution** : L'utilisateur doit se déconnecter et se reconnecter pour recharger ses métadonnées.

---

Une fois le trigger installé, tous les nouveaux utilisateurs auront automatiquement `is_admin: false` ! 🎉
