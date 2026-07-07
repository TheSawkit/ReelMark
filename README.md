# 🎬 ReelMark

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![CI](https://github.com/TheSawkit/ReelMark/actions/workflows/ci.yml/badge.svg)](https://github.com/TheSawkit/ReelMark/actions/workflows/ci.yml)

> **Stop wasting hours deciding what to watch.** A cinema-themed personal watchlist tracker — a self-hostable alternative to TV Time.

**[🇬🇧 English](#-english) | [🇫🇷 Français](#-français)**

---

<a name="-english"></a>

## 🇬🇧 English

A bilingual (EN/FR), installable PWA to track movies and TV shows episode-by-episode, rate and review them, build playlists, and follow friends — powered by TMDB, with Supabase auth/DB and per-section privacy controls.

### ✨ Features

|      | Feature                          | Description                                                                   |
| ---- | -------------------------------- | ----------------------------------------------------------------------------- |
| 🎞️ | **Personal tracking**      | Complete history of your movies, shows, and episodes across every season      |
| 📺   | **Episode-level tracking** | Track every episode — never ask "did we watch this one?" again               |
| 🔍   | **Smart exploration**      | Browse 700k+ titles from the TMDB catalog with intelligent regional filtering |
| ⭐   | **Ratings & reviews**      | Rate on a 1–10 scale and write reviews visible on your public profile        |
| 📁   | **Playlists**              | Create themed collections and share them publicly                             |
| 👥   | **Friends & community**    | Send friend requests, follow friends' watchlists and reviews                  |
| 🎭   | **Crew profiles**          | Full filmographies, biographies, and credits for every crew member            |
| 📱   | **Installable PWA**        | Works on iPhone, Android, Mac, Windows, and Linux — no app store required    |
| 🌍   | **Native bilingualism**    | Instant EN/FR switching with server-side language detection                   |
| 🔒   | **Privacy controls**       | Per-section visibility: public, friends only, or private                      |

### 🛠️ Tech Stack

| Layer                 | Technology                                            |
| :-------------------- | :---------------------------------------------------- |
| **Frontend**    | Next.js 16 (App Router) + React 19                    |
| **Language**    | TypeScript 6 (strict)                                 |
| **Styling**     | Tailwind CSS 4 (CSS-first, token-based design system) |
| **Auth & DB**   | Supabase (PostgreSQL + Row-Level Security)            |
| **Media data**  | TMDB API                                              |
| **Streaming**   | Watchmode API                                         |
| **PWA**         | Serwist (Service Worker + precaching)                 |
| **Errors**      | Sentry SDK → self-hosted Bugsink                     |
| **UI**          | Radix UI · shadcn/ui · lucide-react · sonner       |
| **Tests**       | Vitest (unit) · Playwright (E2E)                     |
| **Package mgr** | pnpm 11                                               |

### 📋 Prerequisites

- **Node.js 22.13+** and **pnpm 11+**
- A [TMDB Read Access Token](https://developer.themoviedb.org/docs/getting-started)
- A [Supabase](https://supabase.com) project
- A [Watchmode](https://api.watchmode.com) API key

### 🚀 Quick Start

```bash
git clone https://github.com/TheSawkit/ReelMark.git
cd ReelMark
pnpm install
cp .env.example .env.local   # then fill in the values (see Configuration)
pnpm dev                     # http://localhost:3000
```

Database: run the SQL migrations in order from the Supabase SQL Editor — start with `supabase/migrations/001_profile_features.sql` (creates `user_profiles`, `privacy_settings`, `reviews`, `playlists`, `playlist_items`, `friendships` with RLS policies).

### ⚙️ Configuration

All variables live in `.env.local` (see `.env.example`). `NEXT_PUBLIC_*` are exposed to the browser; the rest are server-only.

| Variable                                     | Scope  | Description                                         |
| :------------------------------------------- | :----- | :-------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | public | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | public | Supabase anon/publishable key                       |
| `SUPABASE_SERVICE_ROLE_KEY`                | server | Supabase admin key —**never** exposed client |
| `TMDB_READ_ACCESS_TOKEN`                   | server | TMDB API v4 read access token                       |
| `WATCHMODE_API_KEY`                        | server | Watchmode API key (streaming providers)             |
| `NEXT_PUBLIC_BASE_URL`                     | public | Site base URL (e.g.`https://reelmark.silexio.be`) |
| `NEXT_PUBLIC_SENTRY_DSN`                   | public | Bugsink DSN (browser) —**must be `https`** |
| `SENTRY_DSN`                               | server | Bugsink DSN (server)                                |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | test   | Credentials for authenticated E2E tests             |

### 📦 Available Scripts

| Command              | Description                                                                  |
| :------------------- | :--------------------------------------------------------------------------- |
| `pnpm dev`         | Start the dev server                                                         |
| `pnpm build`       | Production build (**`next build --webpack`** — required by Serwist) |
| `pnpm start`       | Start the production server                                                  |
| `pnpm lint`        | Run ESLint                                                                   |
| `pnpm format`      | Format with Prettier                                                         |
| `pnpm test`        | Unit tests (Vitest)                                                          |
| `pnpm test:watch`  | Unit tests in watch mode                                                     |
| `pnpm test:e2e`    | E2E tests (Playwright)                                                       |
| `pnpm test:e2e:ui` | E2E tests with the Playwright UI                                             |

> **Build note:** the build **must** use webpack (`next build --webpack`). `@serwist/next` does not support Turbopack — a Turbopack build produces no `sw.js` and no service-worker registration.

### 📁 Project Structure

```
ReelMark/
├── app/                    # Next.js App Router (Server Components by default)
│   ├── [lang]/             # Localized routes (fr/en): movie, tv, crew, explorer, dashboard, settings…
│   ├── actions/            # Server Actions — all mutations (watchlist, reviews, friends…)
│   ├── api/                # Route handlers (search, health)
│   ├── auth/               # OAuth callback / email confirm
│   ├── service-worker.ts   # Serwist service worker
│   └── globals.css         # Design tokens (@theme inline)
├── components/             # media/ · profile/ · settings/ · navigation/ · ui/ (shadcn) · effects/
├── lib/                    # tmdb/ · supabase/ · i18n/ · search/ · validators.ts · metadata.ts …
├── hooks/                  # Reusable client hooks
├── types/                  # Shared TypeScript types (database.ts, tmdb.ts, profile.ts)
├── supabase/migrations/    # SQL schema migrations
├── k8s/                    # Kubernetes manifests (deployment, service, ingress, HPA)
├── docs/                   # Project documentation (deployment, security)
├── Dockerfile              # Multi-stage production image (output: standalone)
└── tests/                  # unit/ (Vitest) · e2e/ (Playwright)
```

### 🚢 Deployment

Production runs on **Infomaniak Public Cloud (managed Kubernetes)** behind **Cloudflare** (TLS · CDN · WAF). The container image lives on **ghcr.io**; CI/CD is handled by GitHub Actions.

**Full step-by-step runbook → [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).**

- `Dockerfile` — multi-stage, `output: standalone`. Build stays `next build --webpack`.
- `k8s/` — `app.yaml` (deployment · service · HPA), `ingress.yaml`, `secret.example.yaml`.
- `.github/workflows/deploy.yml` — push to `main` → build → push to ghcr.io → rollout.
- ⚠️ **Cluster bootstrap:** Infomaniak provides only the control plane. You must install **Cilium (CNI) + OpenStack CCM** first ([docs/DEPLOYMENT.md § 2](./docs/DEPLOYMENT.md)), otherwise nodes stay `NotReady` and nothing schedules.

### 📚 Documentation

- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Infomaniak Kubernetes deployment runbook
- **[docs/SECURITY.md](./docs/SECURITY.md)** — security policy

### 🤝 Contributing

- Branch from `dev`; open PRs against `main`.
- **Conventional Commits** (`feat`, `fix`, `chore`, `refactor`, `docs`).
- Before a PR: `pnpm lint && pnpm test && pnpm test:e2e`.

### 📄 License

No open-source license — all rights reserved © SAWKIT. Contact the author for reuse.

---

<a name="-français"></a>

## 🇫🇷 Français

PWA installable et bilingue (FR/EN) pour suivre films et séries épisode par épisode, les noter et critiquer, créer des playlists et suivre ses amis — propulsée par TMDB, avec auth/BDD Supabase et contrôle de confidentialité par section. Une alternative auto-hébergeable à TV Time.

### ✨ Fonctionnalités

|      | Fonctionnalité                         | Description                                                                 |
| ---- | --------------------------------------- | --------------------------------------------------------------------------- |
| 🎞️ | **Suivi personnel**               | Historique complet de tes films, séries et épisodes, saison par saison    |
| 📺   | **Suivi par épisode**            | Suis ta progression réelle — plus jamais "on en était où ?"             |
| 🔍   | **Exploration intelligente**      | 700k+ titres du catalogue TMDB avec filtrage régional pertinent            |
| ⭐   | **Notes et avis**                 | Note de 1 à 10 et écris des critiques visibles sur ton profil public      |
| 📁   | **Playlists**                     | Crée des collections thématiques et partage-les                           |
| 👥   | **Amis & communauté**            | Envoie des demandes d'amis, suis les listes et critiques de tes amis        |
| 🎭   | **Profils d'équipe**             | Filmographies complètes, biographies et crédits pour chaque intervenant   |
| 📱   | **PWA installable**               | Fonctionne sur iPhone, Android, Mac, Windows et Linux — aucun store requis |
| 🌍   | **Bilingue natif**                | Bascule EN/FR instantanée avec détection de langue côté serveur         |
| 🔒   | **Contrôle de confidentialité** | Visibilité par section : public, amis uniquement, ou privé                |

### 🛠️ Stack technique

| Couche                    | Technologie                                    |
| :------------------------ | :--------------------------------------------- |
| **Frontend**        | Next.js 16 (App Router) + React 19             |
| **Langage**         | TypeScript 6 (strict)                          |
| **Styles**          | Tailwind CSS 4 (CSS-first, système de tokens) |
| **Auth & BDD**      | Supabase (PostgreSQL + RLS)                    |
| **Données média** | TMDB API                                       |
| **Streaming**       | Watchmode API                                  |
| **PWA**             | Serwist (Service Worker + précaching)         |
| **Erreurs**         | SDK Sentry → Bugsink auto-hébergé           |
| **Tests**           | Vitest (unitaires) · Playwright (E2E)         |

### 📋 Prérequis

- **Node.js 22.13+** et **pnpm 11+**
- Un [token TMDB](https://developer.themoviedb.org/docs/getting-started), un projet [Supabase](https://supabase.com), une clé [Watchmode](https://api.watchmode.com)

### 🚀 Installation rapide

```bash
git clone https://github.com/TheSawkit/ReelMark.git
cd ReelMark
pnpm install
cp .env.example .env.local   # puis remplis les valeurs (voir Configuration en anglais)
pnpm dev                     # http://localhost:3000
```

BDD : exécute les migrations SQL dans l'ordre depuis l'éditeur Supabase, en commençant par `supabase/migrations/001_profile_features.sql`.

### 📦 Scripts

Voir le tableau **Available Scripts** dans la section anglaise. Note : le build **doit** utiliser webpack (`next build --webpack`) — Serwist ne supporte pas Turbopack.

### 🚢 Déploiement

Production sur **Infomaniak Public Cloud (Kubernetes managé)** derrière **Cloudflare** (TLS · CDN · WAF), image sur **ghcr.io**, CI/CD via GitHub Actions. Runbook complet → **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**.

> ⚠️ Infomaniak ne fournit que le control plane : il faut installer **Cilium (CNI) + CCM OpenStack** soi-même (voir `docs/DEPLOYMENT.md` § 2), sinon les nodes restent `NotReady`.

### 📚 Documentation & Contribution

- Docs : [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) · [`docs/SECURITY.md`](./docs/SECURITY.md)
- Contribution : branche depuis `dev`, PR vers `main`, commits conventionnels, `pnpm lint && pnpm test && pnpm test:e2e` avant toute PR.

### 📄 Licence

Aucune licence open-source — tous droits réservés © SAWKIT.

---

<p align="center">
  Built with 🍿 by <a href="https://github.com/TheSawkit">SAWKIT</a>
</p>
