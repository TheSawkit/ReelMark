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

| #   | Fuite                                                                                                                                                                                            | Correctif                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `mergeWithWatchlist` téléchargeait **toute** la watchlist (3 pages de 1 000 lignes, ~600 Ko) pour badger ~20 cartes, sur chaque fiche, page crew, explorer et recherche — 8 000 fois/jour        | Requête ciblée sur les ids affichés, regroupée par requête HTTP (`createWatchlistEntryLoader`) ; le dashboard passe la liste qu'il a déjà                                                                                       |
| 2   | `supabase.auth.getUser()` à chaque rendu, passage du proxy et Server Action : 57 000 appels `/auth/v1/user`/jour, autant de lignes de log Auth                                                   | `getClaims()` : vérification locale du JWT ES256 contre le JWKS mis en cache 10 min (`getUserContext`, `proxy`)                                                                                                                 |
| 3   | Rendus anonymes : `get_public_reviews` + `get_media_rating` sur chaque fiche ; `get_show_rating` / `get_season_rating` en `SECURITY INVOKER`, refusés à `anon` (24 000 `permission denied`/jour) | Index `reviewed_media_index` en `'use cache'` (60 s) : un anonyme n'interroge la base que pour un titre déjà noté ; plus d'appel voué à l'échec                                                                                 |
| 4   | Avatars servis bruts (190 Ko à 930 Ko pour un affichage de 32 à 128 px), `max-age=3600`                                                                                                          | Réduits à 512 px en WebP dans le navigateur avant upload ; `cacheControl` d'un an (nom de fichier unique à chaque upload)                                                                                                       |
| 5   | Layout : 5 requêtes par rendu (non-lues, avatar, invitations, taille de la watchlist, plateformes)                                                                                               | Une seule RPC `my_shell_state`, partagée par la navbar et le slot d'invitations                                                                                                                                                 |
| 6   | Compteurs de `/library` : toute la watchlist rapatriée pour être comptée en JS                                                                                                                   | RPC `watchlist_counts` (≤ 6 lignes)                                                                                                                                                                                             |
| 7   | Progression séries : `episode_watch_counts` + `episode_last_watches` renvoyaient toutes les séries en deux allers-retours                                                                        | RPC `my_tv_progress(p_tv_ids)` : les séries demandées, compte et dernier visionnage en un appel                                                                                                                                 |
| 8   | Profil : appel admin `getUserById` à chaque vue, watchlist entière téléchargée même pour un profil privé                                                                                         | Nom depuis `user_profiles.full_name` ; admin seulement pour un compte sans avatar stocké ; seuls les statuts visibles sont lus                                                                                                  |
| 9   | Realtime : abonnement lancé avant que le socket ait le JWT → rôle `anon` → `invalid column for filter user_id` (5 000 erreurs/jour) puis rejoin                                                  | `withRealtimeClient` attend `realtime.setAuth()` et une session                                                                                                                                                                 |
| 10  | CI : la suite E2E tournait contre la base de prod (7 000 à 26 000 requêtes par run), deux fois par push sur `dev` avec une PR ouverte (événements `push` + `pull_request`)                       | La CI démarre sa propre base Supabase depuis `supabase/migrations/` (`supabase start`), la seede et joue la suite dessus : plus aucune requête vers un projet hébergé, hormis la sonde RLS de la prod (une dizaine de lectures) |

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

La suite E2E et `next dev` pointaient sur le projet de prod : 50 % des requêtes du diagnostic. Le schéma complet est maintenant dans `supabase/migrations/` — `20260101000000_baseline.sql` (l'état de la prod reconstitué depuis son catalogue), puis les migrations suivantes — et une base construite depuis ce seul dossier est identique à la prod sur 16 catégories comparées (colonnes, contraintes, index, RLS, policies, définitions de fonctions, droits, triggers, publication Realtime, bucket `avatars`, event trigger, extensions). `scripts/seed-test-account.mjs` y crée le compte de test.

### En local : `supabase start` (Docker)

```bash
npx supabase@latest start -x studio,imgproxy,logflare,vector,edge-runtime,mailpit,postgres-meta,supavisor
npx supabase@latest status -o env   # API_URL, ANON_KEY, SERVICE_ROLE_KEY
```

Renseigner `.env.local` avec ces valeurs (`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, clé anon, clé service role — ce sont les clés de démonstration publiques de la CLI), plus `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` au choix, puis :

```bash
pnpm seed:test                            # compte de test, ami, invitation en attente, ~70 titres
pnpm test:e2e                             # contre http://localhost:3000 (pnpm dev ou pnpm start)
npx supabase@latest db reset && pnpm seed:test   # repartir d'une base vierge
```

La stack locale signe ses JWT en ES256 comme la prod : `getClaims()` y vérifie aussi les tokens sans appel réseau. Les confirmations d'email y sont désactivées (`supabase/config.toml`).

### En CI : une base locale par run

Le job `e2e` de `ci.yml` fait exactement le parcours local : `supabase start` (base vierge construite depuis `supabase/migrations/`), `pnpm seed:test`, puis la suite complète contre `pnpm start`. Le build inline l'URL `http://127.0.0.1:54321` et la clé anon de démonstration de la CLI dans le bundle servi par ce job. Aucun secret Supabase n'est nécessaire, et rien ne touche un projet hébergé.

Le job `rls-production` garde, lui, un œil sur la prod : il lance `tests/e2e/rls.spec.ts` avec les secrets `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, une dizaine de lectures anonymes qui échouent si une table privée devient lisible — par exemple après une modification faite à la main qui aurait divergé du repo. Il tourne sur les PR, sur `main` et à la demande.

### Sans Docker : un projet Supabase de test hébergé

Pour développer avec `next dev` sans stack locale :

1. Créer un projet Supabase dédié. Le Free autorise deux projets gratuits actifs ([Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)) : si un autre projet gratuit existe déjà, le mettre en pause. Surtout, **les quotas du Free sont comptés par organisation** (« The quota is applied to your entire organization » — [Billing](https://supabase.com/docs/guides/platform/billing-on-supabase)) : un projet de test dans l'organisation de la prod consomme le même quota d'egress. Le créer dans une autre organisation, pour qu'il ne puisse ni pénaliser la prod ni être bloqué par elle.
2. Y appliquer le schéma depuis le repo : `npx supabase@latest link --project-ref <ref-du-projet-de-test>` puis `npx supabase@latest db push`. Vérifier que le ref lié est bien celui du projet de test : ces deux commandes ne doivent **jamais** viser la prod (voir plus bas).
3. Authentication → URL Configuration : ajouter `http://localhost:3000/**` aux Redirect URLs.
4. Pointer `.env.local` sur ce projet (URL, clés anon et service role, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`), puis `pnpm seed:test --remote`. Le script refuse la prod, et tout projet hébergé sans `--remote`.

### Ne jamais rejouer les migrations sur la prod

La prod porte déjà tout ce que contient la baseline, mais son historique de migrations (`supabase_migrations.schema_migrations`) ne la connaît pas : il liste les 36 migrations appliquées au fil de l'eau avant le 2026-09-28, dont les fichiers n'existent pas. Sur la prod, `supabase db push` tenterait donc de rejouer la baseline (elle échouerait sur la première table existante, dans une transaction annulée) et `supabase db reset --linked` effacerait les données. Les migrations de prod continuent de passer par l'éditeur SQL ou `apply_migration` (MCP), puis sont commitées sous la version que Supabase leur a donnée.

Pour qu'un jour `supabase migration list` soit cohérent sur la prod, il faudra y enregistrer la baseline comme déjà appliquée (`supabase migration repair --status applied 20260101000000`) : une écriture dans la prod, à faire délibérément, pas en passant.

### Ce que la baseline reproduit tel quel

Elle copie la prod du 2026-09-28, défauts compris ; les migrations qui la suivent les corrigent, comme elles l'ont fait en prod :

- `friendships` porte deux CHECK identiques (`friendships_check`, `friendships_no_self_friendship`) → `friendships_check` supprimé par `api_grants_hygiene` ;
- `anon` a MAINTAIN sur `watchlist` et `privacy_settings`, et tous les droits (RLS en garde) sur `recommendation_dismissals`, `user_prompts` et `user_streaming_providers` → retirés par `api_grants_hygiene`, qui ferme aussi les droits par défaut d'`anon` sur les futurs objets de `public` ;
- `get_public_reviews` / `get_public_episode_reviews` font confiance à `p_viewer_id` → le lecteur vient de `auth.uid()` depuis `public_reviews_viewer_from_jwt` ;
- l'endpoint GraphQL reste exécutable par `anon` (la migration `disable_public_graphql_endpoint` du 2026-07-05 n'a jamais pris effet : `postgres` n'est pas l'accordeur des droits sur `graphql_public.graphql`) → extension `pg_graphql` supprimée par `drop_unused_graphql`.
