# Modèle de données

PostgreSQL (Supabase), 16 tables, RLS attendue sur chacune — à contrôler après toute modification du schéma :

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

La CI vérifie aussi, avec la clé anonyme, qu'aucune table strictement privée n'est lisible par un visiteur (`tests/e2e/rls.spec.ts`) : sur la base construite depuis les migrations (job `e2e`) et sur la prod elle-même (workflow `rls-production.yml`).

Le schéma complet est versionné dans `supabase/migrations/` : `20260101000000_baseline.sql` reconstitue la prod telle qu'elle était le 2026-09-28 (tables, contraintes, index, RLS, policies, fonctions, droits, triggers dont `on_auth_user_created` sur `auth.users`, publication Realtime, bucket `avatars` et ses policies, event trigger `ensure_rls`), les migrations suivantes s'y ajoutent sous la version que leur a donnée Supabase. Une base construite depuis ce dossier est identique à la prod ; les migrations de prod passent par l'éditeur SQL ou `apply_migration`, jamais par `supabase db push` (voir [SUPABASE-USAGE.md](./SUPABASE-USAGE.md#ne-jamais-rejouer-les-migrations-sur-la-prod)). `types/database.ts` est le type généré qui fait foi côté code (`supabase gen types typescript` via MCP/CLI).

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

| Table         | Rôle                                                                                                           | Clés     |
| ------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| `rate_limits` | Compteurs partagés entre pods du budget d'appels d'outils : `key` (`<fenêtre>:<user_id>`), `count`, `reset_at` | PK `key` |

- Écrite uniquement par `consume_rate_limits` (voir plus bas) ; RLS activée sans policy, droits retirés à `anon` et `authenticated` : seul le service role y accède.
- Deux lignes au plus par utilisateur (fenêtre minute, fenêtre jour), remises à zéro sur place à l'expiration : pas de purge nécessaire.

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
| Friendships        | **RLS restrictive** (`friendships_read_own`) — on ne lit que ses propres liens ; afficher les amis d'un autre passe par `createAdminClient()` avec contrôle de visibilité applicatif dans l'action (`getFriendsWithProfiles`) ; une demande naît forcément `pending` (policy INSERT) et le destinataire ne peut modifier que `status` / `updated_at` (droit UPDATE par colonne, migration `friendships_avatars_input_bounds`)       |
| Episode_watches    | **RLS restrictive** (owner-only) — mesuré le 2026-08-02 : lecture croisée = 0 ligne, là où `watchlist` en renvoie. La progression d'un autre passe par la fonction `episode_watch_counts_for` (**RLS + visibilité en base**), appelée par `getProfileTvWatchProgress`                                                                                                                                                               |

> Piège : la restriction d'`episode_watches` est **silencieuse**. Une lecture avec le client standard sur le `user_id` d'un autre ne lève aucune erreur — elle renvoie zéro ligne, donc une progression à 0 % qui passe pour une donnée valide. `my_tv_progress` agrège sur `auth.uid()` : elle ne sert que le viewer lui-même.

## Fonctions SQL exposées

- `get_media_rating`, `get_episodes_rating`, `get_public_episode_reviews` — agrégats de notes publiques, appelables par tous par design (advisors Supabase : warns acceptés).
- `can_view_watch_activity(p_owner)` — `true` si `auth.uid()` peut voir l'activité de visionnage de `p_owner` (section watchlist **ou** vus visible ; pas de ligne `privacy_settings` = tout public, comme `getPrivacySettings`).
- `episode_watch_counts_for(p_user_id)` — nombre d'épisodes vus par série pour un profil visité, gardé par la précédente. `SECURITY DEFINER`, `search_path` figé, `execute` révoqué de `public`/`anon` et accordé à `authenticated` : un appel non authentifié répond `permission denied`, et un appel service-role (sans `auth.uid()`) renvoie zéro ligne.
- `get_show_rating`, `get_season_rating` — agrégats de notes d'épisodes, en `SECURITY INVOKER` : `reviews` n'étant pas lisible par `anon`, un appel anonyme échoue. L'app ne les appelle donc que pour un utilisateur connecté.

Fonctions ajoutées pour réduire l'egress (voir [SUPABASE-USAGE.md](./SUPABASE-USAGE.md)) — toutes `SECURITY INVOKER`, `search_path` vide, `execute` révoqué de `public`/`anon` :

| Fonction                                         | Rôle                                                                                                                  | Exécutable par                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `watchlist_counts()`                             | Titres du viewer par (`media_type`, `status`), au plus 6 lignes — compteurs de `/library`                             | `authenticated`, `service_role` |
| `my_tv_progress(p_tv_ids int[])`                 | Épisodes vus (saison 0 incluse) et dernier visionnage par série demandée ; à appeler par paquets de 1 000 ids         | `authenticated`, `service_role` |
| `my_shell_state()`                               | Non-lues, avatar, date du profil, taille de la watchlist, plateformes renseignées, réponses aux invitations           | `authenticated`, `service_role` |
| `reviewed_media_index()`                         | Une ligne : ids des films / séries notés ou critiqués, séries ayant une critique d'épisode — gate des rendus anonymes | `service_role`                  |
| `user_episode_watch_counts(p_user_id, p_tv_ids)` | Épisodes vus par série pour n'importe quel compte (cron hebdo, MCP)                                                   | `service_role`                  |

`episode_watch_counts()` et `episode_last_watches()` ne sont plus appelées par l'app ; elles restent en base le temps qu'aucun pod d'une version antérieure ne tourne, puis peuvent être supprimées.

- `consume_rate_limits(p_keys, p_limits, p_window_seconds, p_cost)` — débite `p_cost` de chaque fenêtre en une transaction, tout ou rien : renvoie `null` si toutes l'acceptent, sinon le `reset_at` de la première fenêtre épuisée, sans rien débiter. Le verrou de ligne pris par l'upsert sérialise les appels concurrents sur une même clé. `execute` réservé au service role. Appelée par `lib/mcp/budget.ts` ; tant qu'elle manque ou échoue, le budget retombe sur les compteurs en mémoire du pod (avec un avertissement `[mcp:budget]` dans les logs).

Définition appliquée sur le projet (migration `mcp_shared_rate_limits`) :

```sql
create table public.rate_limits (
	key text primary key,
	count integer not null,
	reset_at timestamptz not null
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;
grant select, insert, update on table public.rate_limits to service_role;

create or replace function public.consume_rate_limits(
	p_keys text[],
	p_limits integer[],
	p_window_seconds integer[],
	p_cost integer
) returns timestamptz
language plpgsql
set search_path = ''
as $$
declare
	v_count integer;
	v_reset_at timestamptz;
begin
	if p_cost <= 0 then
		return null;
	end if;
	for i in 1 .. coalesce(array_length(p_keys, 1), 0) loop
		insert into public.rate_limits as r (key, count, reset_at)
		values (p_keys[i], 0, now() + make_interval(secs => p_window_seconds[i]))
		on conflict (key) do update
			set count = case when r.reset_at <= now() then 0 else r.count end,
				reset_at = case when r.reset_at <= now() then excluded.reset_at else r.reset_at end
		returning r.count, r.reset_at into v_count, v_reset_at;
		if v_count + p_cost > p_limits[i] then
			return v_reset_at;
		end if;
	end loop;
	update public.rate_limits set count = count + p_cost where key = any (p_keys);
	return null;
end;
$$;

revoke execute on function public.consume_rate_limits(text[], integer[], integer[], integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limits(text[], integer[], integer[], integer) to service_role;
```

## Métadonnées auth

`auth.users.user_metadata` : `username`, `full_name`, `region`, `language`, `mcp_access` (affichage de l'accès du lien IA). La région (`BE`, `FR`, …) pilote le filtrage TMDB ; la langue le défaut i18n.

## Suppression de compte

`deleteAccount` (settings) purge d'abord toutes les données de l'utilisateur avec `purgeUserData` (`lib/data/account-purge.ts`), puis supprime le compte via l'API admin. La purge ne dépend pas des cascades : elles ne sont pas toutes en `ON DELETE CASCADE` (`notifications.sender_id` est en `SET NULL`), et une cascade manquante laisserait des lignes orphelines ou ferait échouer `deleteUser`. Le lien IA est révoqué en premier. Un test unitaire compare la liste des tables purgées au schéma généré : toute nouvelle table avec un `user_id` doit y être ajoutée.
