# Guide de Gestion des Administrateurs

## Architecture

Le système utilise une table PostgreSQL `admins` dans Supabase :
- Chaque utilisateur a automatiquement une entrée dans la table `admins` lors de l'inscription
- Par défaut : `is_admin = false`
- Pour promouvoir en admin : modifier la valeur dans la table

## Installation de la table (À faire UNE FOIS)

1. Allez sur **Supabase Dashboard** > **SQL Editor**
2. Copiez-collez le contenu de `database_setup.sql`
3. Cliquez sur **Run**
4. La table `admins` est créée avec un trigger automatique ✅

## Promouvoir un utilisateur en Admin

### Méthode 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur **Supabase Dashboard**

2. Sélectionnez votre projet **MyEvent**

3. Dans la barre latérale, cliquez sur **Table Editor**

4. Sélectionnez la table **admins**

5. Trouvez la ligne de l'utilisateur (vous verrez son `user_id`)

6. Cliquez sur la cellule `is_admin`

7. Cochez la case pour mettre `true`

8. L'utilisateur doit se **déconnecter et se reconnecter** pour voir le changement

### Méthode 2 : Via SQL (Pour les utilisateurs avancés)

1. Allez dans **SQL Editor** dans Supabase

2. Pour promouvoir un utilisateur :

```sql
UPDATE public.admins
SET is_admin = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email@example.com'
);
```

3. Pour retirer les droits admin :

```sql
UPDATE public.admins
SET is_admin = false
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email@example.com'
);
```

## Vérifier le statut admin d'un utilisateur

### Dans l'application

Quand un utilisateur admin se connecte, il verra :
- Un badge jaune avec 🔑 "Administrateur"
- Le message "Vous avez les droits d'administration"

### Dans Supabase

1. Allez dans **Table Editor** > **admins**
2. Regardez la colonne `is_admin`
3. Si `is_admin = true`, l'utilisateur est admin

## Lister tous les administrateurs

### Via Table Editor
1. **Table Editor** > **admins**
2. Filtrez par `is_admin = true`

### Via SQL

```sql
SELECT
  a.user_id,
  u.email,
  u.raw_user_meta_data->>'first_name' as first_name,
  a.is_admin,
  a.created_at
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.is_admin = true;
```

## Questions Fréquentes

### L'utilisateur ne voit pas son badge admin après la modification

**Solution** : L'utilisateur doit se déconnecter et se reconnecter. Les métadonnées sont chargées lors de la connexion.

### Puis-je créer un utilisateur admin directement à l'inscription ?

Non, ce n'est pas recommandé pour des raisons de sécurité. Par défaut, tous les utilisateurs sont créés avec `is_admin = false` automatiquement via le trigger. Vous devez manuellement promouvoir les utilisateurs en admin via la table `admins`.

### Comment protéger une route pour les admins uniquement ?

Dans votre code, vérifiez la table `admins` :

```typescript
const { data: { user } } = await supabase.auth.getUser()

const { data: adminData } = await supabase
  .from('admins')
  .select('is_admin')
  .eq('user_id', user.id)
  .single()

if (!adminData?.is_admin) {
  router.push('/') // Rediriger si pas admin
  return
}
```

### Puis-je avoir plusieurs niveaux de permissions ?

Oui ! Vous pouvez modifier la table `admins` pour ajouter :
- Une colonne `role` (admin, moderator, user)
- Une colonne `permissions` (jsonb avec les permissions)

Exemple :
```sql
ALTER TABLE public.admins ADD COLUMN role text DEFAULT 'user';
ALTER TABLE public.admins ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;
```

## Sécurité

### Row Level Security (RLS)

La table `admins` est protégée par RLS :
- ✅ **Lecture** : Tout le monde peut lire (pour vérifier si quelqu'un est admin)
- ✅ **Modification** : Seuls les admins peuvent modifier la table

### Bonnes pratiques

1. Vérifiez toujours les permissions côté serveur pour les opérations critiques
2. N'utilisez jamais uniquement la vérification côté client
3. La table `admins` avec RLS est parfaite pour sécuriser les opérations sensibles

## Exemple : Premier Admin

Pour créer votre premier admin (vous-même) :

1. **Exécutez le script SQL** `database_setup.sql` (une seule fois)
2. **Inscrivez-vous** normalement via l'application
3. Allez sur **Supabase Dashboard** > **Table Editor** > **admins**
4. Trouvez votre ligne (par `user_id`)
5. Cochez `is_admin = true`
6. **Déconnectez-vous et reconnectez-vous**
7. Vous verrez le badge admin ! 🎉

---

Créé pour MyEvent - Gestion d'administrateurs avec table PostgreSQL
