# Modèle de données

PostgreSQL (Supabase). **RLS activée sur les 12 tables.** Le schéma est appliqué directement sur le projet Supabase (pas de fichiers SQL versionnés) ; `types/database.ts` est le type généré qui fait foi côté code (`supabase gen types typescript` via MCP/CLI).

## Tables

### Suivi

| Table             | Rôle                            | Clés                                                    |
| ----------------- | ------------------------------- | ------------------------------------------------------- |
| `watchlist`       | Films/séries suivis avec statut | UNIQUE (`user_id`, `media_id`, `media_type`)            |
| `episode_watches` | Épisodes vus, un par ligne      | (`user_id`, `tv_id`, `season_number`, `episode_number`) |

- `watchlist` : `media_id` (int TMDB), `media_type` (`movie`\|`tv`), `media_title`, `poster_path`, `status` (`to_watch`\|`watched`), plus les colonnes de tri/filtre : `release_date`, `genre_ids`, `total_episodes` (peuplées à l'insertion via `getListMediaMetadata`).
- Le statut watchlist d'une série est resynchronisé après chaque toggle d'épisode (`syncTvShowWatchlistStatus`) ; la saison 0 (specials) est exclue du total. Le passage à « vu » utilise `>=` (TMDB peut réduire le nombre d'épisodes).
- Supprimer une série de la watchlist supprime aussi ses `episode_watches`.

### Profil et social

| Table                          | Rôle                                                                                                                                      | Clés                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `user_profiles`                | Profil public : `username` (unique insensible à la casse), `full_name`, `avatar_url`, `bio`, liens sociaux                                | PK `user_id`                                     |
| `privacy_settings`             | Visibilité par section : `watchlist_visibility`, `watched_visibility`, `reviews_visibility`, `playlists_visibility`, `friends_visibility` | PK `user_id`                                     |
| `friendships`                  | Demandes d'amis directionnelles, `status` (`pending`\|`accepted`\|`rejected`)                                                             | UNIQUE (`requester_id`, `addressee_id`)          |
| `reviews`                      | Note 1–10 + critique texte brut                                                                                                           | UNIQUE (`user_id`, `media_id`, `media_type`)     |
| `playlists` / `playlist_items` | Collections thématiques                                                                                                                   | UNIQUE (`playlist_id`, `media_id`, `media_type`) |

- `user_profiles.full_name` + `avatar_url` sont **la source d'affichage** partout (amis, playlists, recherche `@username`). Copiés depuis les metadata auth par le trigger `handle_new_user` au signup, synchronisés par settings/onboarding. Ne jamais rappeler l'API admin Supabase pour les résoudre.
- Valeurs de visibilité : `public` | `friends` | `private` (défaut : tout public).

### Notifications

| Table                      | Rôle                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `notifications`            | Flux : `type`, expéditeur (`sender_id`, `sender_username`), média concerné, `read_at` |
| `notification_preferences` | Opt-in par type : `friend_requests`, `friend_accepted`, `new_episodes`, `suggestions` |
| `notification_dedup`       | Clé de déduplication (`dedup_key`) pour éviter les doublons                           |
| `push_subscriptions`       | Abonnements Web Push (`endpoint`, `p256dh`, `auth`)                                   |

## Modèle de visibilité (important)

Deux mécanismes complémentaires — vérifier `pg_policies` avant de crier à la fuite :

| Donnée             | Filtrage                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playlists          | **RLS** — la policy filtre par visibilité directement en base                                                                                                                                                                 |
| Watchlist, reviews | **Applicatif** — lues avec le client standard puis filtrées par `canViewWithVisibility()` (`lib/privacy.ts`)                                                                                                                  |
| Friendships        | **RLS restrictive** (`friendships_read_own`) — on ne lit que ses propres liens ; afficher les amis d'un autre passe par `createAdminClient()` avec contrôle de visibilité applicatif dans l'action (`getFriendsWithProfiles`) |

## Fonctions SQL exposées

- `get_media_rating`, `get_episodes_rating`, `get_public_episode_reviews` — agrégats de notes publiques, appelables par tous par design (advisors Supabase : warns acceptés).

## Métadonnées auth

`auth.users.user_metadata` : `username`, `full_name`, `region`, `language`. La région (`BE`, `FR`, …) pilote le filtrage TMDB ; la langue le défaut i18n.

## Suppression de compte

`deleteAccount` (settings) supprime l'utilisateur via l'API admin ; toutes les FK sont `ON DELETE CASCADE` — aucune donnée orpheline.
