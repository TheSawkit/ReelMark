# Consommation Supabase

Le projet tourne sur le plan **Free** : 5 Go d'egress non caché, 5 Go d'egress caché, 2 projets actifs. Au-delà, Supabase répond `402` à toutes les requêtes API jusqu'au cycle suivant, ou jusqu'au passage en Pro ([Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)). En septembre 2026 le quota a sauté : 9 Go d'egress et 6,7 Go de logs pour **deux** utilisateurs actifs. Ce document garde la trace du diagnostic et les règles qui en découlent.

## Diagnostic du 2026-09-28 (logs Supabase, 24 h)

344 000 requêtes edge en 24 h, soit 4 par seconde en continu.

| Source (ASN des logs edge)         | Requêtes | Ce que c'était                                                                                                                                                                                  |
| ---------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pods de prod (Infomaniak)          |  170 000 | 99 % de rendus **anonymes** de fiches film/série/saison — des robots d'indexation — chacun appelant 2 à 3 RPC de notes et critiques pour 45 critiques en base ; 24 000 de ces appels échouaient |
| Runners GitHub Actions (Microsoft) |   77 000 | La suite E2E, contre la base de prod, avec un compte de test de 2 078 titres et 17 190 épisodes                                                                                                 |
| Poste de dev (FAI local)           |   95 000 | `next dev` et E2E locaux, même compte de test                                                                                                                                                   |

Ce qui pesait, par ordre d'impact :

| #   | Fuite                                                                                                                                                                                            | Correctif                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `mergeWithWatchlist` téléchargeait **toute** la watchlist (3 pages de 1 000 lignes, ~600 Ko) pour badger ~20 cartes, sur chaque fiche, page crew, explorer et recherche — 8 000 fois/jour        | Requête ciblée sur les ids affichés, regroupée par requête HTTP (`createWatchlistEntryLoader`) ; le dashboard passe la liste qu'il a déjà       |
| 2   | `supabase.auth.getUser()` à chaque rendu, passage du proxy et Server Action : 57 000 appels `/auth/v1/user`/jour, autant de lignes de log Auth                                                   | `getClaims()` : vérification locale du JWT ES256 contre le JWKS mis en cache 10 min (`getUserContext`, `proxy`)                                 |
| 3   | Rendus anonymes : `get_public_reviews` + `get_media_rating` sur chaque fiche ; `get_show_rating` / `get_season_rating` en `SECURITY INVOKER`, refusés à `anon` (24 000 `permission denied`/jour) | Index `reviewed_media_index` en `'use cache'` (60 s) : un anonyme n'interroge la base que pour un titre déjà noté ; plus d'appel voué à l'échec |
| 4   | Avatars servis bruts (190 Ko à 930 Ko pour un affichage de 32 à 128 px), `max-age=3600`                                                                                                          | Réduits à 512 px en WebP dans le navigateur avant upload ; `cacheControl` d'un an (nom de fichier unique à chaque upload)                       |
| 5   | Layout : 5 requêtes par rendu (non-lues, avatar, invitations, taille de la watchlist, plateformes)                                                                                               | Une seule RPC `my_shell_state`, partagée par la navbar et le slot d'invitations                                                                 |
| 6   | Compteurs de `/library` : toute la watchlist rapatriée pour être comptée en JS                                                                                                                   | RPC `watchlist_counts` (≤ 6 lignes)                                                                                                             |
| 7   | Progression séries : `episode_watch_counts` + `episode_last_watches` renvoyaient toutes les séries en deux allers-retours                                                                        | RPC `my_tv_progress(p_tv_ids)` : les séries demandées, compte et dernier visionnage en un appel                                                 |
| 8   | Profil : appel admin `getUserById` à chaque vue, watchlist entière téléchargée même pour un profil privé                                                                                         | Nom depuis `user_profiles.full_name` ; admin seulement pour un compte sans avatar stocké ; seuls les statuts visibles sont lus                  |
| 9   | Realtime : abonnement lancé avant que le socket ait le JWT → rôle `anon` → `invalid column for filter user_id` (5 000 erreurs/jour) puis rejoin                                                  | `withRealtimeClient` attend `realtime.setAuth()` et une session                                                                                 |
| 10  | CI : la suite E2E tournait deux fois par push sur `dev` avec une PR ouverte (événements `push` + `pull_request`), 7 000 à 26 000 requêtes par run                                                | E2E sur les PR, sur `main` et à la demande ; secrets `E2E_*` pour la pointer vers un projet de test                                             |

## Règles

- **Jamais `fetchAllRows` pour afficher une page.** Il rapatrie tout, par pages de 1 000. Réservé aux exports, imports, jobs et au moteur de goûts, qui lisent réellement toute la bibliothèque.
- **Filtrer et agréger en SQL, pas en JS.** Une RPC qui prend les ids utiles (`= any(p_ids)`) et renvoie une ligne par groupe coûte quelques octets ; filtrer après coup coûte toute la table du compte.
- **Une RPC qui renvoie un ensemble est plafonnée à 1 000 lignes par PostgREST.** Envoyer les ids par paquets de 1 000 (`getMyTvProgress`) ou renvoyer une seule ligne agrégée (`reviewed_media_index`).
- **Identité : `getUserContext()` (claims), jamais `auth.getUser()` sur un chemin chaud.** `getFullUser()` (un appel réseau) est réservé aux réglages et aux opérations de compte. Après un `updateUser({ data })`, appeler `refreshSessionClaims()` pour que le token porte les nouvelles métadonnées.
- **Rendu anonyme = zéro requête par défaut.** Toute lecture communautaire sur une page publique passe par l'index des titres notés ; tout nouvel appel en `SECURITY INVOKER` est inaccessible à `anon`.
- **Une fonction SQL nouvelle est versionnée** dans `supabase/migrations/` avec la version que lui donne `apply_migration`, et ajoutée à la main à `types/database.ts` si la génération de types est indisponible.

## Surveiller

Dashboard Supabase → **Usage** pour les compteurs du cycle. Pour attribuer le trafic, **Logs → Logs Explorer** (ou l'outil `query_logs` du MCP Supabase), sur 24 h :

```sql
-- Qui appelle ? (prod / CI / dev local)
select log_attributes['request.cf.asOrganization'] as org, count(*) as n
from logs where source = 'edge_logs' group by org order by n desc

-- Quoi ?
select log_attributes['request.path'] as path,
       log_attributes['response.status_code'] as status,
       log_attributes['request.sb.apikey.authorization.prefix'] as anon_key,
       count(*) as n
from logs where source = 'edge_logs'
group by path, status, anon_key order by n desc limit 30

-- Erreurs Postgres (chacune est une ligne de log facturée)
select substring(event_message, 1, 160) as msg, count(*) as n
from logs where source = 'postgres_logs' group by msg order by n desc limit 15
```

`anon_key` non vide = requête sans utilisateur (pages publiques, robots). `content_range` sur `/rest/v1/*` donne le nombre de lignes renvoyées : `2000-2115/*` sur une page de tableau de bord est le signe d'un `fetchAllRows` qui s'est glissé dans un rendu.

## Tests E2E et environnement de dev

La suite E2E et `next dev` pointent par défaut sur le projet de prod : 50 % des requêtes du diagnostic. Pour les en sortir :

1. Créer un second projet Supabase (le Free en autorise deux actifs), y appliquer le schéma, créer le compte de test.
2. Renseigner dans GitHub → Settings → Secrets → Actions : `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`. `ci.yml` les préfère aux secrets de prod dès qu'ils existent, pour le build comme pour les tests.
3. En local, pointer `.env.local` sur ce projet pour le développement courant.

Prérequis : le schéma n'est pas encore entièrement versionné (seules les migrations à partir du 2026-09-28 sont dans `supabase/migrations/`). Le dump complet est à faire avant de pouvoir recréer une base de test à l'identique.
