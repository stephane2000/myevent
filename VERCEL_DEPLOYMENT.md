# Guide de Déploiement sur Vercel

## Prérequis

Avant de déployer, assurez-vous d'avoir :
- ✅ Un compte GitHub (https://github.com/stephane2000)
- ✅ Un compte Vercel (créez-en un sur https://vercel.com avec votre compte GitHub)
- ✅ Votre projet Supabase configuré (voir SUPABASE_SETUP.md)
- ✅ Les clés Supabase (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Étape 1 : Préparer le Projet pour GitHub

### 1.1 Initialiser Git

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
git init
git add .
git commit -m "Initial commit - MyEvent application"
```

### 1.2 Créer un Repo GitHub

1. Allez sur https://github.com/new
2. Remplissez :
   - **Repository name** : `myevent`
   - **Description** : "Application de gestion d'événements avec Next.js et Supabase"
   - **Public** ou **Private** : votre choix
3. **NE cochez PAS** "Add a README file" (on en a déjà un)
4. Cliquez sur **"Create repository"**

### 1.3 Pousser le Code sur GitHub

GitHub vous donnera des commandes. Utilisez celles-ci :

```bash
git remote add origin https://github.com/stephane2000/myevent.git
git branch -M main
git push -u origin main
```

Si on vous demande vos identifiants, utilisez un **Personal Access Token** (pas votre mot de passe) :
- Allez sur https://github.com/settings/tokens
- Cliquez sur **"Generate new token (classic)"**
- Cochez `repo`
- Copiez le token et utilisez-le comme mot de passe

## Étape 2 : Déployer sur Vercel

### 2.1 Connecter GitHub à Vercel

1. Allez sur https://vercel.com
2. Cliquez sur **"Sign Up"** ou **"Login"**
3. Choisissez **"Continue with GitHub"**
4. Autorisez Vercel à accéder à vos repos GitHub

### 2.2 Importer le Projet

1. Sur le dashboard Vercel, cliquez sur **"Add New..."** > **"Project"**
2. Trouvez votre repo **"myevent"** dans la liste
3. Cliquez sur **"Import"**

### 2.3 Configurer le Projet

1. **Project Name** : Laissez `myevent` ou changez si vous voulez
2. **Framework Preset** : Next.js (devrait être détecté automatiquement)
3. **Root Directory** : `./` (laissez par défaut)
4. **Build Command** : `npm run build` (par défaut)
5. **Output Directory** : `.next` (par défaut)

### 2.4 Ajouter les Variables d'Environnement

**TRÈS IMPORTANT** : Avant de déployer, ajoutez vos clés Supabase !

1. Déroulez la section **"Environment Variables"**
2. Ajoutez ces deux variables :

   **Variable 1 :**
   - Name : `NEXT_PUBLIC_SUPABASE_URL`
   - Value : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)

   **Variable 2 :**
   - Name : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value : Votre clé anon Supabase (ex: `eyJhbGci...`)

3. Cliquez sur **"Deploy"**

### 2.5 Attendre le Déploiement

Vercel va maintenant :
- Installer les dépendances (`npm install`)
- Builder l'application (`npm run build`)
- Déployer sur son CDN

Cela prend généralement 1-2 minutes.

## Étape 3 : Configurer les URL de Redirection Supabase

Une fois déployé, Vercel vous donnera une URL du type :
```
https://myevent-xyz.vercel.app
```

**Important** : Ajoutez cette URL dans Supabase !

1. Allez sur votre dashboard Supabase
2. **Authentication** > **URL Configuration**
3. Dans **Redirect URLs**, ajoutez :
   ```
   https://myevent-xyz.vercel.app
   https://myevent-xyz.vercel.app/**
   ```
4. Cliquez sur **"Save"**

## Étape 4 : Tester l'Application

1. Cliquez sur le bouton **"Visit"** sur Vercel ou allez sur votre URL
2. Vous devriez être redirigé vers `/login`
3. Cliquez sur **"S'inscrire"**
4. Créez un compte avec :
   - Votre prénom
   - Votre email
   - Un mot de passe
5. Connectez-vous
6. Vous devriez voir : **"Bienvenue [Votre Prénom]"**

## Déploiements Automatiques

Bonne nouvelle ! Maintenant, à chaque fois que vous poussez du code sur GitHub :

```bash
git add .
git commit -m "Mon message de commit"
git push
```

Vercel va **automatiquement** :
- Détecter le nouveau commit
- Rebuilder l'application
- Déployer la nouvelle version

Vous pouvez suivre les déploiements sur : https://vercel.com/dashboard

## Domaine Personnalisé (Optionnel)

Si vous voulez un domaine personnalisé (ex: `myevent.com`) :

1. Sur Vercel, allez dans votre projet > **Settings** > **Domains**
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS
4. N'oubliez pas d'ajouter le nouveau domaine dans Supabase !

## Commandes Utiles

### Voir les Logs sur Vercel
1. Allez dans votre projet sur Vercel
2. Cliquez sur **"Deployments"**
3. Cliquez sur le déploiement actif
4. Cliquez sur **"Logs"** pour voir les erreurs

### Redéployer Manuellement
Si quelque chose ne va pas :
1. Allez sur Vercel > votre projet
2. Onglet **"Deployments"**
3. Cliquez sur les **"..."** du dernier déploiement
4. Cliquez sur **"Redeploy"**

### Variables d'Environnement
Pour modifier vos clés Supabase :
1. Vercel > projet > **Settings** > **Environment Variables**
2. Modifiez ou ajoutez les variables
3. **Redéployez** pour que les changements prennent effet

## Problèmes Courants

### "Module not found" ou erreurs de build
- Vérifiez que toutes les dépendances sont dans `package.json`
- Essayez de redéployer

### "Invalid API key" en production
- Vérifiez que les variables d'environnement sont bien configurées sur Vercel
- Vérifiez qu'il n'y a pas d'espaces dans les valeurs

### Page blanche ou erreur 404
- Vérifiez les logs sur Vercel
- Assurez-vous que le build s'est bien passé

### Problèmes d'authentification
- Vérifiez que l'URL Vercel est bien ajoutée dans Supabase
- Vérifiez que les clés Supabase sont correctes

## Architecture du Déploiement

```
GitHub (code source)
    ↓
Vercel (build + hosting)
    ↓
Utilisateurs ← → Supabase (authentification + database)
```

## Résumé des URLs Importantes

- **Dashboard Vercel** : https://vercel.com/dashboard
- **Votre App** : https://votre-projet.vercel.app
- **Dashboard Supabase** : https://supabase.com/dashboard
- **Repo GitHub** : https://github.com/stephane2000/myevent

## Support

- Documentation Vercel : https://vercel.com/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation Supabase : https://supabase.com/docs

Votre application est maintenant déployée et accessible dans le monde entier ! 🚀
