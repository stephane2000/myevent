# Guide de Gestion des Administrateurs

## Comment fonctionne le système is_admin ?

Tous les nouveaux utilisateurs sont créés avec `is_admin: false` par défaut. Pour promouvoir un utilisateur en administrateur, vous devez modifier ses métadonnées dans Supabase.

## Promouvoir un utilisateur en Admin

### Méthode 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard

2. Sélectionnez votre projet **MyEvent**

3. Dans la barre latérale, cliquez sur **Authentication** > **Users**

4. Vous verrez la liste de tous vos utilisateurs

5. Cliquez sur l'utilisateur que vous voulez promouvoir

6. Cherchez la section **"Raw User Meta Data"** ou **"User Metadata"**

7. Vous verrez quelque chose comme :
   ```json
   {
     "first_name": "Stéphane"
   }
   ```

8. Modifiez pour ajouter `is_admin` :
   ```json
   {
     "first_name": "Stéphane",
     "is_admin": true
   }
   ```

9. Cliquez sur **Save** ou **Update**

10. L'utilisateur doit se **déconnecter et se reconnecter** pour que le changement prenne effet

### Méthode 2 : Via SQL (Pour les utilisateurs avancés)

Si vous préférez utiliser SQL, voici comment faire :

1. Allez dans **SQL Editor** dans Supabase

2. Exécutez cette requête (remplacez l'email par celui de l'utilisateur) :

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'email@example.com';
```

3. Pour retirer les droits admin :

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'false'::jsonb
)
WHERE email = 'email@example.com';
```

## Vérifier le statut admin d'un utilisateur

### Dans l'application

Quand un utilisateur admin se connecte, il verra :
- Un badge jaune avec 🔑 "Administrateur"
- Le message "Vous avez les droits d'administration"

### Dans Supabase

1. Allez dans **Authentication** > **Users**
2. Cliquez sur l'utilisateur
3. Regardez le champ **User Metadata**
4. Si `is_admin: true`, l'utilisateur est admin

## Lister tous les administrateurs

Via SQL dans Supabase :

```sql
SELECT
  id,
  email,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'is_admin' as is_admin,
  created_at
FROM auth.users
WHERE (raw_user_meta_data->>'is_admin')::boolean = true;
```

## Questions Fréquentes

### L'utilisateur ne voit pas son badge admin après la modification

**Solution** : L'utilisateur doit se déconnecter et se reconnecter. Les métadonnées sont chargées lors de la connexion.

### Puis-je créer un utilisateur admin directement à l'inscription ?

Oui, mais ce n'est pas recommandé pour des raisons de sécurité. Par défaut, tous les utilisateurs sont créés sans droits admin. Vous devez manuellement promouvoir les utilisateurs en admin via le dashboard Supabase.

### Comment protéger une route pour les admins uniquement ?

Dans votre code, utilisez :

```typescript
const isAdmin = user?.user_metadata?.is_admin || false

if (!isAdmin) {
  router.push('/') // Rediriger si pas admin
  return
}
```

### Puis-je avoir plusieurs niveaux de permissions ?

Oui ! Vous pouvez ajouter d'autres champs comme :
- `role: "admin" | "moderator" | "user"`
- `permissions: ["create", "edit", "delete"]`

Ajoutez-les simplement dans `user_metadata` de la même manière que `is_admin`.

## Sécurité

**Important** : Le champ `is_admin` dans les métadonnées utilisateur est accessible côté client. Pour les opérations sensibles :

1. Vérifiez toujours les permissions côté serveur
2. Utilisez les Row Level Security (RLS) policies dans Supabase
3. Ne faites jamais confiance uniquement aux métadonnées côté client

Pour l'instant, ce système est parfait pour afficher des badges et cacher/montrer des éléments d'interface, mais pour les opérations critiques, ajoutez des vérifications serveur.

## Exemple : Premier Admin

Pour créer votre premier admin (vous-même) :

1. Inscrivez-vous normalement via l'application
2. Allez sur Supabase Dashboard
3. Authentication > Users
4. Cliquez sur votre compte
5. Modifiez User Metadata pour ajouter `"is_admin": true`
6. Déconnectez-vous et reconnectez-vous
7. Vous verrez le badge admin !

---

Créé pour MyEvent - Gestion simple des administrateurs
