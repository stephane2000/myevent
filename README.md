# MyEvent

Application de gestion d'événements avec authentification, construite avec Next.js et Supabase.

## Fonctionnalités

- Inscription utilisateur avec prénom
- Connexion / Déconnexion
- Page d'accueil personnalisée avec message de bienvenue
- Authentification sécurisée via Supabase
- Design responsive avec Tailwind CSS

## Technologies Utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Pour un code type-safe
- **Supabase** - Backend-as-a-Service (authentification, base de données)
- **Tailwind CSS** - Framework CSS utility-first
- **Vercel** - Plateforme de déploiement

## Structure du Projet

```
myevent/
├── app/
│   ├── login/
│   │   └── page.tsx          # Page de connexion
│   ├── register/
│   │   └── page.tsx          # Page d'inscription
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Page d'accueil (protégée)
│   └── globals.css           # Styles globaux
├── lib/
│   └── supabase.ts           # Configuration client Supabase
├── SUPABASE_SETUP.md         # Guide de configuration Supabase
├── VERCEL_DEPLOYMENT.md      # Guide de déploiement Vercel
└── package.json
```

## Installation Locale (Optionnel)

Si vous voulez tester localement avant de déployer :

```bash
# Installer les dépendances
npm install

# Créer le fichier .env.local avec vos clés Supabase
cp .env.example .env.local
# Puis éditez .env.local avec vos vraies clés

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur http://localhost:3000

## Configuration Supabase

Suivez le guide détaillé dans [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) pour :
1. Créer un projet Supabase
2. Récupérer vos clés API
3. Configurer l'authentification
4. Configurer les URL de redirection

Vous aurez besoin de ces 2 variables :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Déploiement sur Vercel

Suivez le guide détaillé dans [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) pour :
1. Pousser le code sur GitHub
2. Connecter le repo à Vercel
3. Configurer les variables d'environnement
4. Déployer automatiquement

## Flux Utilisateur

1. **Première visite** → Redirection vers `/login`
2. **Clic sur "S'inscrire"** → Page `/register`
3. **Inscription** → Création du compte + redirection vers `/login`
4. **Connexion** → Redirection vers `/` (page d'accueil)
5. **Page d'accueil** → Affiche "Bienvenue [Prénom]"
6. **Déconnexion** → Retour à `/login`

## Variables d'Environnement Requises

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Scripts Disponibles

```bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Construire l'application pour la production
npm run start    # Démarrer le serveur de production
npm run lint     # Lancer le linter
```

## Sécurité

- Les mots de passe sont hashés par Supabase
- Les clés API publiques sont safe pour le client
- La clé `service_role` n'est jamais exposée
- Protection des routes avec vérification de l'authentification

## Support

Pour toute question ou problème :
- Consultez [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Consultez [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Ouvrez une issue sur GitHub

## Licence

MIT

---

Créé avec ❤️ par [Stéphane](https://github.com/stephane2000)
