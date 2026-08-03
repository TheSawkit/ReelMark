# Architecture

ReelMark est une application **100 % frontend** : un seul projet Next.js 16 (App Router), sans backend custom. Supabase fournit l'authentification et la base de données, TMDB les données médias. Tout le rendu initial se fait côté serveur (Server Components), toutes les mutations passent par des Server Actions.

## Vue d'ensemble

```
Navigateur / PWA
   │
   ▼
proxy.ts (middleware Next 16) ── redirect locale · garde des routes protégées · rate-limit /api/search
   │
   ▼
Server Components (app/[lang]/**/page.tsx)
   ├──► lib/tmdb/*          → API TMDB (fetch avec revalidate: 3600)
   └──► lib/supabase/server → PostgreSQL (RLS active)

Client Components ("use client")
   └──► Server Actions (app/actions/*) ──► Supabase + revalidatePath()
```

## Routing et i18n

- Toutes les pages vivent sous `app/[lang]/` (`fr` | `en`). Un chemin sans locale est redirigé par `proxy.ts` selon le cookie `preferred-language` puis l'en-tête `Accept-Language`.
- Groupes de routes : `(auth)` pour login/signup/reset, `(protected)` pour dashboard/library/settings (gardés par le middleware **et** `requireAuth()` côté page).
- Traductions : `lib/i18n/translations.ts` est la source unique de toutes les chaînes UI. Serveur → `getTranslations()` ; client → hook `useTranslation()`. La parité FR/EN est garantie par le type `Translations`.

## Authentification

- Supabase Auth (email/password + OAuth Google). Cookies gérés par `@supabase/ssr`.
- Deux points d'entrée uniques dans `lib/supabase/auth-helpers.ts` :
    - `getAuthenticatedUser()` — jette si non connecté ; utilisé par toutes les mutations.
    - `getOptionalUser()` — `userId` nullable ; utilisé par les lectures publiques.
- `createAdminClient()` (service role, bypass RLS) sert uniquement aux lectures/écritures que la RLS interdit par construction : création du profil au signup, suppression de compte, et lecture des amis d'un autre utilisateur (`getFriendsWithProfiles`). Règle : toute fonction qui l'utilise porte elle-même son contrôle d'autorisation, jamais seulement celui de la page appelante. Quand la donnée s'y prête, préférer une fonction SQL `SECURITY DEFINER` qui porte la visibilité en base (`episode_watch_counts_for`) — le service role ne quitte alors jamais le serveur d'auth. Ne jamais l'utiliser pour résoudre des avatars — `user_profiles` est la source d'affichage.
- Flux OAuth : `signInWithOAuth` (client) → Supabase → `/auth/callback` (échange du code, redirige vers `BASE_URL`). Les liens email passent par `/auth/confirm`.

## Données médias (TMDB / Watchmode)

- Tous les appels TMDB passent par `fetchTMDB()` (`lib/tmdb/client.ts`) : injection du token, de la langue et de la région, cache `revalidate: 3600`. Jamais d'appel TMDB direct depuis le client — le navigateur passe par `/api/search` ou par des Server Actions.
- La Belgique (`BE`) fusionne les régions BE + FR (`REGION_MERGE_CONFIG`).
- Watchmode fournit les plateformes de streaming (`lib/watchmode/`), même modèle de cache.
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

| Couche                    | Mécanisme                                                                      | Durée                               |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| TMDB / Watchmode          | `fetch` + `next.revalidate`                                                    | 1 h                                 |
| `/api/search`             | `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` (edge Cloudflare) | 1 h + SWR 24 h                      |
| Router client             | `experimental.staleTimes`                                                      | 90 s (dynamique) / 180 s (statique) |
| Déduplication par requête | `React.cache()` (watchlist, auth, i18n, genres, région)                        | requête                             |
| Mutations                 | `revalidatePath()` sur chaque Server Action d'écriture                         | immédiat                            |

Avec 2 replicas en production, chaque pod a son propre cache `fetch` — sans conséquence avec un TTL d'une heure sur des données publiques TMDB. Si un jour le projet adopte ISR ou `use cache`, il faudra un cache handler partagé (Redis).

## SEO

- `generateMetadata()` sur toutes les pages, `metadataBase` sur `BASE_URL`, canonical + hreflang via `localizedAlternates()` (`lib/metadata.ts`).
- JSON-LD schema.org `Movie` / `TVSeries` injecté sur les pages détail (`lib/structured-data.ts`).
- `app/sitemap.ts` (localisé, alimenté par les listes TMDB populaires) et `app/robots.ts` (bots IA et crawlers SEO agressifs bloqués).

## Observabilité

Erreurs client, serveur et edge envoyées à **Bugsink** (compatible protocole Sentry, auto-hébergé sur `sentry.silexio.be`) via `@sentry/nextjs` : `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, et `onRequestError` dans `instrumentation.ts`. Le DSN doit être en **https** (CSP `connect-src`).

## Arborescence

Voir la section « Project Structure » du [README](../README.md) pour l'arborescence détaillée. Règle générale : Server Components dans `app/`, composants réutilisables dans `components/` (skeleton co-localisé avec chaque composant complexe), logique partagée dans `lib/`, hooks client dans `hooks/`, types partagés (2+ fichiers) dans `types/`.
