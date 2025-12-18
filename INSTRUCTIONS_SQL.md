# Instructions SQL - À exécuter dans Supabase

## Fonction manquante pour afficher les prestataires

Pour que la page `/prestataires` fonctionne correctement et affiche la liste des prestataires, vous devez **IMPÉRATIVEMENT** exécuter le script SQL suivant dans votre dashboard Supabase :

### Étapes :
1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu du fichier `get_all_prestataires_function.sql`
5. Cliquer sur **Run** pour exécuter

### Que fait ce script ?
Cette fonction RPC (`get_all_prestataires`) récupère tous les prestataires avec leurs informations depuis la base de données :
- Nom et prénom
- Nom de l'entreprise
- Catégorie de service
- Ville
- Note moyenne
- Nombre d'avis
- Nombre de services

### Fichiers SQL à exécuter (dans l'ordre)

#### 1. `create_prestataire_system.sql` (si pas déjà fait)
Ce fichier crée toutes les tables nécessaires au système de prestataires :
- `prestataire_services` - Les services proposés par les prestataires
- `prestataire_availability` - Les disponibilités
- `booking_requests` - Les demandes de réservation
- `reviews` - Les avis clients
- `conversations` et `messages` - Le système de messagerie
- `prestataire_stats` - Les statistiques (notes, nombre d'avis, etc.)

#### 2. `get_all_prestataires_function.sql` (CRITIQUE)
Cette fonction permet d'afficher les prestataires sur la page `/prestataires`.

**SANS CETTE FONCTION, LA PAGE SERA VIDE !**

---

## Vérification

Une fois les scripts exécutés, vous devriez voir :
- ✅ Les prestataires apparaître sur `/prestataires`
- ✅ Les services apparaître dans l'onglet "Annonces" de l'admin (`/admin`)
- ✅ La création/modification de services fonctionner correctement

## En cas de problème

Si après avoir exécuté les scripts, la liste est toujours vide :
1. Vérifiez que vous avez bien des utilisateurs avec le rôle `prestataire` dans la table `user_roles`
2. Vérifiez que ces prestataires ont bien créé au moins un service
3. Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles
