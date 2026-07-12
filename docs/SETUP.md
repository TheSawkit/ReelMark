# Reproduire le projet de zéro

Guide complet pour monter un environnement ReelMark fonctionnel (dev local ou nouvelle instance).

## 1. Prérequis

- **Node.js 22.13+** (LTS) et **pnpm 11+** (`corepack enable` suffit)
- Un compte [Supabase](https://supabase.com) (plan gratuit OK)
- Un [TMDB Read Access Token](https://developer.themoviedb.org/docs/getting-started) (API v4, gratuit)
- Une clé [Watchmode](https://api.watchmode.com) (plateformes de streaming — optionnelle en dev, la section providers sera vide sans)
- Optionnel : une instance [Bugsink](https://www.bugsink.com/) (ou tout serveur compatible protocole Sentry) pour les erreurs

## 2. Cloner et installer

```bash
git clone https://github.com/TheSawkit/ReelMark.git
cd ReelMark
pnpm install
cp .env.example .env.local
```

## 3. Créer le projet Supabase

1. Nouveau projet sur [supabase.com](https://supabase.com) → noter l'URL du projet et la clé publishable (Settings → API).
2. **Schéma** : le schéma n'est pas versionné en SQL dans le repo — il est appliqué directement sur le projet Supabase (voir [DATA-MODEL.md](./DATA-MODEL.md) pour le schéma complet des 12 tables, les policies RLS et les triggers à créer). Pour une nouvelle instance, recréer les tables depuis ce document via l'éditeur SQL Supabase.
3. **Auth** :
    - Activer Email + Google (Authentication → Providers). Pour Google : créer un OAuth Client dans Google Cloud Console avec le redirect `https://<projet>.supabase.co/auth/v1/callback`.
    - **URL Configuration** : Site URL = ton domaine (ou `http://localhost:3000` en dev) ; ajouter aux Redirect URLs : `<domaine>/auth/callback`, `<domaine>/auth/confirm`, `http://localhost:3000/**`. Un Site URL obsolète redirige les logins OAuth vers l'ancien domaine.
4. **Storage** : créer un bucket public `avatars` (upload d'avatar dans les settings).

## 4. Variables d'environnement

Remplir `.env.local` :

| Variable                                 | Où la trouver                                            |
| ---------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | Supabase → Settings → API                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | Supabase → Settings → API (clé publishable)              |
| `SUPABASE_SERVICE_ROLE_KEY`              | Supabase → Settings → API (secrète — jamais côté client) |
| `TMDB_READ_ACCESS_TOKEN`                 | TMDB → Settings → API → API Read Access Token            |
| `WATCHMODE_API_KEY`                      | watchmode.com → dashboard                                |
| `NEXT_PUBLIC_BASE_URL`                   | `http://localhost:3000` en dev, le domaine en prod       |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`  | Bugsink → projet → DSN (**https obligatoire** en prod)   |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | compte de test créé à la main, pour les E2E authentifiés |

Piège : pour les env vars pouvant valoir `""`, le code utilise `||` et non `??` — une chaîne vide doit retomber sur le défaut.

## 5. Lancer

```bash
pnpm dev          # http://localhost:3000
pnpm test         # unitaires (Vitest) — aucun service requis
pnpm test:e2e     # Playwright — nécessite un serveur sur :3000 (pnpm build && pnpm start)
                  # et TEST_USER_EMAIL/PASSWORD pour tests/e2e/protected/
```

En local, Playwright ne démarre pas le serveur lui-même (`webServer` n'est configuré qu'en CI) : lancer `pnpm build && pnpm start` dans un autre terminal d'abord.

## 6. Vérifier que tout marche

1. `http://localhost:3000` → landing, bascule FR/EN.
2. Signup email → le profil `user_profiles` est créé automatiquement.
3. Rechercher un film, l'ajouter à la watchlist, marquer des épisodes d'une série.
4. `curl http://localhost:3000/api/health` → `{"status":"ok"}`.

## 7. Production

Le déploiement production (Docker + Kubernetes Infomaniak + Cloudflare) est documenté dans [`DEPLOYMENT.md`](../DEPLOYMENT.md) à la racine. Points clés :

- Image Docker multi-stage (`output: standalone`), build **webpack** obligatoire.
- Les `NEXT_PUBLIC_*` sont **inlinées au build** (build-args CI) — changer le domaine exige un rebuild de l'image, pas seulement le secret K8s.
- Secrets serveur uniquement dans le secret K8s `reelmark-secrets`, jamais dans l'image.
