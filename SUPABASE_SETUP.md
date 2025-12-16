# Guide de Configuration Supabase pour MyEvent

## Étape 1 : Créer un Projet Supabase

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard/org/vercel_icfg_kjgt5pXMQZBpFWvMZ1GS51ML

2. Cliquez sur **"New Project"** (Nouveau Projet)

3. Remplissez les informations :
   - **Name** : MyEvent
   - **Database Password** : Choisissez un mot de passe fort (notez-le quelque part !)
   - **Region** : Choisissez la région la plus proche (Europe-West par exemple)
   - **Pricing Plan** : Free (gratuit)

4. Cliquez sur **"Create new project"**

5. Attendez quelques minutes que le projet soit créé

## Étape 2 : Récupérer les Clés API

1. Une fois le projet créé, allez dans **Settings** (Paramètres) dans la barre latérale gauche

2. Cliquez sur **API** dans le menu Settings

3. Vous verrez deux informations importantes :

   ### Project URL
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   → C'est votre `NEXT_PUBLIC_SUPABASE_URL`

   ### Project API keys
   - **anon** / **public** : C'est votre clé publique
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   → C'est votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **NE PRENEZ PAS** la clé `service_role` (elle est secrète et ne doit jamais être exposée)

## Étape 3 : Configurer l'Authentification

1. Dans la barre latérale, allez dans **Authentication** > **Providers**

2. Vérifiez que **Email** est activé (il devrait l'être par défaut)

3. Configurez les paramètres d'email :
   - Descendez jusqu'à **Auth Providers** > **Email**
   - Activez **"Enable email confirmations"** si vous voulez que les utilisateurs confirment leur email
   - Pour le développement, vous pouvez **désactiver** cette option pour aller plus vite

4. Pour désactiver la confirmation d'email (recommandé pour le dev) :
   - Allez dans **Authentication** > **Email Templates**
   - Ou dans **Settings** > **Authentication** > **Email Auth**
   - Décochez **"Enable email confirmations"**

## Étape 4 : Configurer les URL de Redirection

1. Allez dans **Authentication** > **URL Configuration**

2. Ajoutez les URLs suivantes dans **Redirect URLs** :
   ```
   http://localhost:3000
   http://localhost:3000/**
   ```

3. Pour Vercel, une fois déployé, ajoutez aussi :
   ```
   https://votre-app.vercel.app
   https://votre-app.vercel.app/**
   ```

## Étape 5 : Créer le Fichier .env.local

1. Dans le dossier de votre projet MyEvent, créez un fichier `.env.local`

2. Copiez-collez le contenu suivant et remplacez par vos vraies valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Important** : Ce fichier `.env.local` est déjà dans le `.gitignore`, il ne sera pas poussé sur GitHub

## Étape 6 : Vérification de la Configuration

Votre table `users` sera créée automatiquement par Supabase lors de la première inscription.

Pour vérifier :
1. Allez dans **Table Editor** dans Supabase
2. Vous devriez voir une table `auth.users` (créée automatiquement)
3. Les métadonnées comme le prénom seront stockées dans `user_metadata`

## Résumé des Clés Nécessaires

Vous avez besoin de **2 clés seulement** :

| Variable | Où la trouver | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings > API > Project URL | URL de votre projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings > API > anon public key | Clé publique |

## Problèmes Courants

### "Invalid API key"
- Vérifiez que vous avez bien copié la clé `anon` et pas `service_role`
- Vérifiez qu'il n'y a pas d'espaces au début ou à la fin

### "Email not confirmed"
- Allez dans Authentication > Email Templates
- Désactivez "Enable email confirmations" pour le développement

### "User already registered"
- Allez dans Authentication > Users
- Supprimez l'utilisateur et réessayez

## Prêt !

Une fois ces étapes complétées, votre application MyEvent sera connectée à Supabase et prête à fonctionner !
