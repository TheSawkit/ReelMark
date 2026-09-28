# Modèle de données

PostgreSQL (Supabase), 15 tables, RLS attendue sur chacune — à contrôler après toute modification du schéma :

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

La CI vérifie aussi, avec la clé anonyme, qu'aucune table strictement privée n'est lisible par un visiteur (`tests/e2e/rls.spec.ts`).

Le schéma est appliqué directement sur le projet Supabase (pas de fichiers SQL versionnés) ; `types/database.ts` est le type généré qui fait foi côté code (`supabase gen types typescript` via MCP/CLI).

## Tables

### Suivi

| Table             | Rôle                            | Clés                                                    |
| ----------------- | ------------------------------- | ------------------------------------------------------- |
| `watchlist`       | Films/séries suivis avec statut | UNIQUE (`user_id`, `media_id`, `media_type`)            |
| `episode_watches` | Épisodes vus, un par ligne      | (`user_id`, `tv_id`, `season_number`, `episode_number`) |

- `watchlist` : `media_id` (int TMDB), `media_type` (`movie`\|`tv`), `media_title`, `poster_path`, `status` (`to_watch`\|`watched`\|`abandoned`, ce dernier réservé aux séries), plus les colonnes de tri/filtre : `release_date`, `genre_ids`, `total_episodes` (peuplées à l'insertion via `getListMediaMetadata`).
- Le statut watchlist d'une série est resynchronisé après chaque toggle d'épisode (`syncTvShowWatchlistStatus`) ; la saison 0 (specials) est exclue du total. Le passage à « vu » utilise `>=` (TMDB peut réduire le nombre d'épisodes).
- Supprimer une série de la watchlist supprime aussi ses `episode_watches`.
- Les écritures passent par `upsertWatchlistEntry` / `deleteWatchlistEntry` (`lib/data/watchlist-writes.ts`), partagées par les Server Actions et l'outil `update_library` du serveur MCP.

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

### Recommandations et préférences

| Table                       | Rôle                                                                                          | Clés                                         |
| --------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `recommendation_dismissals` | Titres écartés des suggestions (« pas pour moi »), avec leurs genres pour le moteur de goûts  | UNIQUE (`user_id`, `media_id`, `media_type`) |
| `user_streaming_providers`  | Plateformes cochées dans Réglages → Services de streaming (`provider_ids`)                    | une ligne par `user_id`                      |
| `user_prompts`              | État des invitations affichées une fois (installation, import, push…) : `prompt_key`, `state` | UNIQUE (`user_id`, `prompt_key`)             |

Les trois sont lues et écrites avec la session de l'utilisateur, filtrées par `user_id`.

### Assistant IA

| Table      | Rôle                                                                                      | Clés             |
| ---------- | ----------------------------------------------------------------------------------------- | ---------------- |
| `mcp_keys` | Lien secret du serveur MCP : `key_hash` (SHA-256 du secret), `created_at`, `last_used_at` | UNIQUE `user_id` |

- Une ligne par utilisateur : régénérer le lien remplace la ligne, l'ancien secret cesse aussitôt de fonctionner.
- Seul le hash est stocké ; le secret n'est montré qu'une fois, à la génération.
- L'accès (lecture, ou lecture et modification) fait partie du secret haché, pas de la ligne : un lien en écriture commence par `rw-`. `auth.users.user_metadata.mcp_access` n'en garde qu'une copie pour l'affichage dans Réglages.
- RLS réservée au propriétaire (lecture de l'état et révocation depuis Réglages) ; la résolution d'un lien par `/api/mcp/[key]` passe par le service role, sur le hash.

### Notifications

| Table                      | Rôle                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `notifications`            | Flux : `type`, expéditeur (`sender_id`, `sender_username`), média concerné, `read_at` |
| `notification_preferences` | Opt-in par type : `friend_requests`, `friend_accepted`, `new_episodes`, `suggestions` |
| `push_subscriptions`       | Abonnements Web Push (`endpoint`, `p256dh`, `auth`)                                   |

Les notifications `new_episode` sont écrites par le CronJob quotidien (`/api/cron/new-episodes`) ;
une ligne existante pour (utilisateur, série, saison, épisode) sert de déduplication. Les
`suggestion` viennent du CronJob hebdomadaire (`/api/cron/suggestions`) : un titre par utilisateur,
classé par le moteur du dashboard (`pickSuggestion`), jamais un titre déjà suggéré ni déjà en liste. `sender_id`
étant `NOT NULL`, il porte l'id du destinataire pour ces notifications système.

## Modèle de visibilité (important)

Deux mécanismes complémentaires — vérifier `pg_policies` avant de crier à la fuite :

| Donnée             | Filtrage                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playlists          | **RLS** — la policy filtre par visibilité directement en base                                                                                                                                                                                                                                                                                                                                                                       |
| Watchlist, reviews | **RLS + applicatif** — la RLS tient compte de la visibilité (remesuré le 2026-08-02 : un compte `private` renvoie 0 ligne à un autre utilisateur connecté) ; `canViewWithVisibility()` (`lib/privacy.ts`) reste en défense en profondeur — ne pas le retirer, seule la branche `private` a été sondée. Privacy_settings est, lui, lisible par tout connecté (sinon `getPrivacySettings` lirait chaque profil comme « tout public ») |
| Friendships        | **RLS restrictive** (`friendships_read_own`) — on ne lit que ses propres liens ; afficher les amis d'un autre passe par `createAdminClient()` avec contrôle de visibilité applicatif dans l'action (`getFriendsWithProfiles`)                                                                                                                                                                                                       |
| Episode_watches    | **RLS restrictive** (owner-only) — mesuré le 2026-08-02 : lecture croisée = 0 ligne, là où `watchlist` en renvoie. La progression d'un autre passe par la fonction `episode_watch_counts_for` (**RLS + visibilité en base**), appelée par `getProfileTvWatchProgress`                                                                                                                                                               |

> Piège : la restriction d'`episode_watches` est **silencieuse**. Une lecture avec le client standard sur le `user_id` d'un autre ne lève aucune erreur — elle renvoie zéro ligne, donc une progression à 0 % qui passe pour une donnée valide. Les RPC `episode_watch_counts` / `episode_last_watches` sont sans argument et agrègent sur `auth.uid()` : elles ne servent que le viewer lui-même.

## Fonctions SQL exposées

- `get_media_rating`, `get_episodes_rating`, `get_public_episode_reviews` — agrégats de notes publiques, appelables par tous par design (advisors Supabase : warns acceptés).
- `can_view_watch_activity(p_owner)` — `true` si `auth.uid()` peut voir l'activité de visionnage de `p_owner` (section watchlist **ou** vus visible ; pas de ligne `privacy_settings` = tout public, comme `getPrivacySettings`).
- `episode_watch_counts_for(p_user_id)` — nombre d'épisodes vus par série pour un profil visité, gardé par la précédente. `SECURITY DEFINER`, `search_path` figé, `execute` révoqué de `public`/`anon` et accordé à `authenticated` : un appel non authentifié répond `permission denied`, et un appel service-role (sans `auth.uid()`) renvoie zéro ligne.

## Métadonnées auth

`auth.users.user_metadata` : `username`, `full_name`, `region`, `language`, `mcp_access` (affichage de l'accès du lien IA). La région (`BE`, `FR`, …) pilote le filtrage TMDB ; la langue le défaut i18n.

## Suppression de compte

`deleteAccount` (settings) purge d'abord toutes les données de l'utilisateur avec `purgeUserData` (`lib/data/account-purge.ts`), puis supprime le compte via l'API admin. La purge ne dépend pas des cascades : elles ne sont pas toutes en `ON DELETE CASCADE` (`notifications.sender_id` est en `SET NULL`), et une cascade manquante laisserait des lignes orphelines ou ferait échouer `deleteUser`. Le lien IA est révoqué en premier. Un test unitaire compare la liste des tables purgées au schéma généré : toute nouvelle table avec un `user_id` doit y être ajoutée.
