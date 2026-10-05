# Architecture

ReelMark est un seul projet Next.js 16 (App Router), sans service séparé. Supabase fournit l'authentification et la base de données, TMDB et Watchmode les données médias. Le rendu initial se fait côté serveur (Server Components), les mutations passent par des Server Actions, et quelques Route Handlers couvrent ce qui n'est pas une page : recherche, tâches planifiées, serveur MCP de l'assistant IA.

## Vue d'ensemble

```
Navigateur / PWA
   │
   ▼
proxy.ts (middleware Next 16) ── redirect locale · rafraîchissement de session · garde des routes protégées · rate-limit /api/search
   │
   ▼
Server Components (app/[lang]/**/page.tsx)
   ├──► lib/tmdb/*          → API TMDB ("use cache", 1 h par défaut)
   └──► lib/supabase/server → PostgreSQL (RLS active)

Client Components ("use client")
   └──► Server Actions (app/actions/*) ──► Supabase + revalidatePath()

Route Handlers (app/api/*)
   ├──► /api/search           recherche du navigateur
   ├──► /api/cron/*           notifications planifiées (CronJobs, CRON_SECRET)
   └──► /api/mcp/[key]        serveur MCP de l'assistant IA (lien secret)
```

## Routing et i18n

- Toutes les pages vivent sous `app/[lang]/` (`fr` | `en`). Un chemin sans locale est redirigé par `proxy.ts` selon le cookie `preferred-language` puis l'en-tête `Accept-Language`.
- Groupes de routes : `(auth)` pour login/signup/reset, `(protected)` pour dashboard/library/settings (gardés par le middleware **et** `requireAuth()` côté page).
- Traductions : `lib/i18n/translations.ts` est la source unique de toutes les chaînes UI. Serveur → `getTranslations()` ; client → hook `useTranslation()`. La parité FR/EN est garantie par le type `Translations`.

## Authentification

- Supabase Auth (email/password + OAuth Google). Cookies gérés par `@supabase/ssr`.
- Deux points d'entrée uniques dans `lib/supabase/auth-helpers.ts` :
    - `getAuthenticatedUser()` — sans session, redirige vers `/{lang}/login?next=<page>` ; utilisé par toutes les mutations et les lectures réservées au compte. Une Server Action appelée déconnectée envoie donc sur la page de connexion, puis ramène à la page d'origine une fois connecté.
    - `getOptionalUser()` — `userId` nullable ; utilisé par les lectures publiques.
- L'identité vient des **claims du JWT**, vérifiés localement par `getClaims()` contre la clé de signature asymétrique (ES256) du projet, JWKS en cache 10 min par process — dans `getUserContext()` comme dans `proxy.ts`. Aucun aller-retour Auth par requête. `getFullUser()` (un appel `getUser()`) est réservé aux réglages, qui ont besoin des `identities`. Les métadonnées d'un token ne changent qu'à son renouvellement : après `updateUser({ data })`, `refreshSessionClaims()`.
- Côté client, une action qui redirige rejette avec le signal de redirection de Next pendant que le routeur navigue : `toastActionError()` (`lib/action-toast.ts`) n'affiche alors pas de toast d'erreur.
- **Rafraîchissement de session** : `proxy.ts` rafraîchit la session sur toute page qui porte un cookie Supabase (`getSession()` sur les pages publiques — il ne rafraîchit que si le jeton a expiré, sans appel réseau sinon — et `getClaims()` sur les pages protégées) et écrit les jetons dans la réponse **et** dans la requête transmise. Les Server Components ne peuvent pas écrire de cookies : un jeton qu'ils rafraîchiraient eux-mêmes serait perdu, et la réutilisation de l'ancien refresh token révoque toute la session (déconnexions aléatoires).
- Le paramètre `next` du login est validé par `sanitizeRedirectPath()` : seuls les chemins internes sont suivis ; il est transmis au mot de passe, à la passkey, au lien magique et à OAuth.
- `createAdminClient()` (service role, bypass RLS) sert uniquement aux lectures/écritures que la RLS interdit par construction : création du profil au signup, suppression de compte, lecture des amis d'un autre utilisateur (`getFriendsWithProfiles`), et serveur MCP (requêtes sans cookie, toujours bornées au propriétaire du lien). Règle : toute fonction qui l'utilise porte elle-même son contrôle d'autorisation, jamais seulement celui de la page appelante. Quand la donnée s'y prête, préférer une fonction SQL `SECURITY DEFINER` qui porte la visibilité en base (`episode_watch_counts_for`) — le service role ne quitte alors jamais le serveur d'auth. Ne jamais l'utiliser pour résoudre des avatars — `user_profiles` est la source d'affichage.
- Flux OAuth : `signInWithOAuth` (client) → Supabase → `/auth/callback` (échange du code, redirige vers `BASE_URL`). Les liens email passent par `/auth/confirm`.

## Assistant IA (serveur MCP)

Chaque utilisateur peut générer, dans Réglages → Données, un lien secret à coller dans Claude, ChatGPT, Perplexity ou Gemini. Ce lien est un serveur [MCP](https://modelcontextprotocol.io) sans état.

- **Endpoint** : `app/api/mcp/[key]/route.ts`, `POST` uniquement, via `createMcpHandler` de `@modelcontextprotocol/server`. Le segment `[key]` est le secret : 256 bits aléatoires, dont seul le SHA-256 est stocké (`mcp_keys`). Un lien inconnu répond `404` sans corps.
- **Accès** : lecture seule par défaut. Un lien en écriture porte le préfixe `rw-` _dans_ la valeur hachée (`lib/mcp/keys.ts`) : ajouter ce préfixe à un lien en lecture change son hash, il ne correspond plus à rien. L'accès se change donc en régénérant le lien ; l'ancien meurt aussitôt. Le compte retient le choix dans `user_metadata.mcp_access`, pour l'affichage seulement — l'autorisation vient toujours du secret. La route transmet l'accès au SDK par `authInfo.scopes` (`library:write`).
- **Outils** (`lib/mcp/tools/`, assemblés par `lib/mcp/server.ts`) : `get_taste_profile`, `get_recommendations`, `search_titles`, `get_title`, `get_watchlist` en lecture ; `update_library` (marquer vu, à voir, abandonné, ou retirer) n'existe que sur un lien en écriture — un lien en lecture ne le liste même pas. Il est limité à la bibliothèque du propriétaire du lien et annoncé comme destructif pour que le client demande confirmation.
- **Budget** (`lib/mcp/budget.ts`) : seuls les `tools/call` comptent (30/min, 50/jour par utilisateur — un lien volé ou en boucle plafonne à ~0,2 Go d'egress par mois) ; le reste du protocole (handshake, `tools/list`, notifications) ne passe que par un garde-fou de 120 requêtes/min.
- **Cache** (`lib/mcp/user-cache.ts`) : goûts de l'utilisateur 10 min (une grosse bibliothèque pèse ~0,5 Mo d'egress Supabase), langue et région 10 min. Une écriture vide le cache des goûts.
- Les écritures passent par `lib/data/watchlist-writes.ts`, comme les Server Actions : mêmes métadonnées TMDB, même revalidation des pages.

## Données médias (TMDB / Watchmode)

- Tous les appels TMDB passent par `fetchTMDB()` (`lib/tmdb/client.ts`) : injection du token, de la langue et de la région, mise en cache par `"use cache"` + `cacheLife` (1 h par défaut, jusqu'à une semaine pour les genres ; les échecs sont gardés moins longtemps que les réponses).
- Un 429 de TMDB (plafond près de 50 requêtes/s par IP, atteint quand un robot parcourt les fiches la nuit) est retenté en respectant `Retry-After` (plafonné à 5 s pour qu'un remplissage `"use cache"` reste sous les 50 s d'un prérendu). Un limiteur par pod a été essayé puis retiré : plus strict que TMDB, il vidait les rangées d'un chargement à froid (bannière Explorer sans diapositive en CI) sans plafonner le total des pods.
- La Belgique (`BE`) fusionne les régions BE + FR (`REGION_MERGE_CONFIG`).
- Watchmode fournit les plateformes de streaming (`lib/watchmode/`), mis en cache par `fetch` + `next.revalidate` (1 h, une semaine pour les logos des stores).
- La recherche utilise `searchMulti` (`lib/tmdb/search.ts`) avec un ranking custom (`lib/search/score.ts`) et des requêtes de repli si trop peu de résultats.

## Design system

- Tailwind CSS 4 **CSS-first** : tous les tokens sont des variables CSS dans `@theme inline` (`app/globals.css`). Aucune valeur de couleur arbitraire dans les composants.
- Thème sombre par défaut (`:root`), clair via `:root.light`, posé par un script inline anti-FOUC dans le layout.
- Polices : Inter (corps, `letter-spacing: -0.011em` façon SF Pro) + Bebas Neue (titres display via la classe `.heading-display`, toujours accompagnée de `leading-none`).
- Rythme : `px-6 lg:px-12` horizontal, tokens `--spacing-section{,-md,-lg}` (3/4/5 rem) vertical.
- Effets « cinematic » (`components/effects/`) : CSS pur, désactivés sur mobile.

## PWA et offline

- Serwist (`app/service-worker.ts` → `public/sw.js`). **Le build doit être `next build --webpack`** : Turbopack ne génère ni `sw.js` ni l'enregistrement du service worker.
- Les pages `/en/offline` et `/fr/offline` sont précachées (`additionalPrecacheEntries` dans `next.config.ts`) et servies comme fallback de navigation hors ligne, avec un matcher par locale dans le service worker.
- Splash screens iOS exhaustifs et icônes maskable déclarés dans `app/[lang]/layout.tsx` + `app/manifest.ts`.

## Cache

| Couche                    | Mécanisme                                                                       | Durée                               |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| TMDB                      | `"use cache"` + `cacheLife` (`lib/tmdb/client.ts`)                              | 1 h par défaut, 1 min sur échec     |
| Watchmode                 | `fetch` + `next.revalidate`                                                     | 1 h                                 |
| Assistant IA (MCP)        | mémoire, par utilisateur (`lib/mcp/user-cache.ts`)                              | goûts 10 min, langue/région 10 min  |
| `/api/search`             | `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` (edge Cloudflare)  | 1 h + SWR 24 h                      |
| Router client             | Router Cache de Next (défauts, aucun réglage expérimental)                      | 0 s (dynamique) / 5 min (préchargé) |
| Index des titres notés    | `'use cache'` + `cacheTag('reviewed-media-index')` (`lib/data/review-index.ts`) | 60 s, invalidé à l'écriture         |
| Déduplication par requête | `React.cache()` (watchlist, auth, i18n, genres, région)                         | requête                             |
| Mutations                 | `revalidatePath()` sur chaque Server Action d'écriture                          | immédiat                            |

`cacheComponents` est activé. Le cache `"use cache"` vit en mémoire, par pod (`cacheMaxMemorySize` : 10 Mo, voir `next.config.ts`) : avec 2 replicas, chaque pod a le sien — sans conséquence pour des données publiques TMDB à durée courte, ni pour l'index des titres notés : seuls les visiteurs anonymes le lisent, et l'autre pod le rafraîchit dans la minute. Les budgets de requêtes (`lib/rate-limiter.ts`) sont eux aussi par pod : la limite effective se multiplie par le nombre de replicas. Exception : le budget d'appels d'outils de l'assistant IA, le seul qui protège un coût réel (Supabase + TMDB), est compté dans Postgres (`consume_rate_limits`) et donc partagé entre pods ; il retombe sur la mémoire du pod si la base ne répond pas. `/api/search` se limite en plus par IP au niveau de Cloudflare (voir `DEPLOYMENT.md`).

## SEO

- `generateMetadata()` sur toutes les pages, `metadataBase` sur `BASE_URL`, canonical + hreflang via `localizedAlternates()` (`lib/metadata.ts`).
- JSON-LD schema.org `Movie` / `TVSeries` injecté sur les pages détail (`lib/structured-data.ts`).
- `app/sitemap.ts` (localisé, alimenté par les listes TMDB populaires) et `app/robots.ts` (bots IA et crawlers SEO agressifs bloqués).

## Observabilité

Erreurs client, serveur et edge envoyées à **Bugsink** (compatible protocole Sentry, auto-hébergé sur `sentry.silexio.be`) via `@sentry/nextjs` : `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, et `onRequestError` dans `instrumentation.ts`. Le DSN doit être en **https** (CSP `connect-src`).

Bugsink groupe par transaction (projet en groupement v1) : sans précaution, une même erreur ouvre une issue par URL. D'où :

- `beforeSend` serveur et edge = `filterServerEvent` (`lib/sentry-filters.ts`). Il écarte les rejets `HANGING_PROMISE_REJECTION` que Next 16.3 lève sur `headers()`/`cookies()`/`"use cache"` quand il interrompt un prérendu (absents de ses digests connus, ils remontaient par `onRequestError` : 884 096 événements sur une seule issue). Il donne une empreinte `upstream-api` par type d'erreur aux pannes TMDB, Watchmode et au quota Supabase.
- `reportSwallowed` (`lib/report.ts`) envoie ses avertissements avec l'empreinte `swallowed/<label>/<message>` : un message de repli doit donc rester constant (pas d'identifiant ni de compteur dedans).
- Les issues de quota (Watchmode, TMDB 429, quota Supabase) sont mutées dans Bugsink, pas résolues : elles reviendront à chaque dépassement.
- Relais vers Linear : Bugsink (Alerting → Custom webhook) poste chaque issue nouvelle, régressée ou démutée sur `/api/bugsink-alert/<BUGSINK_ALERT_SECRET>` (`lib/bugsink-linear.ts`). Un ticket par issue, retrouvé par l'URL Bugsink jointe : une régression commente le ticket existant au lieu d'en ouvrir un autre. Un échec Linear répond 502 (Bugsink note la livraison ratée) et n'est que journalisé, pour ne pas boucler par Sentry.

## Arborescence

Voir la section « Project Structure » de [DEVELOPMENT.md](./DEVELOPMENT.md) pour l'arborescence détaillée. Règle générale : Server Components dans `app/`, composants réutilisables dans `components/` (skeleton co-localisé avec chaque composant complexe), logique partagée dans `lib/`, hooks client dans `hooks/`, types partagés (2+ fichiers) dans `types/`.
