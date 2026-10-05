# ReelMark — Developer guide

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![CI](https://github.com/TheSawkit/ReelMark/actions/workflows/ci.yml/badge.svg)](https://github.com/TheSawkit/ReelMark/actions/workflows/ci.yml)

**[English](#english) | [Français](#français)**

---

<a name="english"></a>

## English

ReelMark is a bilingual (EN/FR) installable PWA for tracking movies and shows episode by episode: ratings and reviews, playlists, friends, personal recommendations, per-section privacy, and an AI-assistant link. It runs on Next.js with Supabase for auth and data, and TMDB and Watchmode for media data.

### Features

| Feature                    | Where it lives                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Movie and episode tracking | `app/actions/watchlist.ts`, `app/actions/episodes.ts`                                               |
| Personal home              | `app/[lang]/(protected)/dashboard` — greeting, continue watching, recommendations                   |
| Recommendations            | `lib/recommendations/` — taste profile built from ratings, watches and dismissals                   |
| Where to watch             | `lib/watchmode/`, TMDB watch providers, filtered by the user's region and streaming services        |
| Ratings and reviews        | `app/actions/reviews.ts` — 1–10 scale, plain text only                                              |
| Playlists and friends      | `app/actions/playlists.ts`, `app/actions/friends.ts`                                                |
| Notifications              | In-app feed, Web Push, daily new-episode and weekly suggestion jobs (`app/api/cron/`)               |
| AI assistant (MCP)         | `app/api/mcp/[key]`, `lib/mcp/` — see [ARCHITECTURE.md](./ARCHITECTURE.md#assistant-ia-serveur-mcp) |
| Import / export            | Settings → Data: Letterboxd, Trakt, TV Time import; JSON export                                     |
| Privacy                    | Public, friends-only or private, per section (`lib/privacy.ts`)                                     |

### Tech stack

| Layer           | Technology                                            |
| :-------------- | :---------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Cache Components) + React 19  |
| Language        | TypeScript 6 (strict)                                 |
| Styling         | Tailwind CSS 4 (CSS-first, token-based design system) |
| Auth and data   | Supabase (PostgreSQL + Row-Level Security)            |
| Media data      | TMDB API, Watchmode API                               |
| AI assistant    | `@modelcontextprotocol/server` (stateless MCP)        |
| PWA             | Serwist (service worker, precaching, Web Push)        |
| Errors          | Sentry SDK → self-hosted Bugsink                      |
| UI              | Radix UI · shadcn/ui · lucide-react · sonner          |
| Tests           | Vitest (unit) · Playwright (E2E)                      |
| Package manager | pnpm 11                                               |

### Prerequisites

- Node.js 24+ and pnpm 11+
- A [TMDB read access token](https://developer.themoviedb.org/docs/getting-started)
- A [Supabase](https://supabase.com) project
- A [Watchmode](https://api.watchmode.com) API key (optional in development: the providers section stays empty without it)

### Quick start

```bash
git clone https://github.com/TheSawkit/ReelMark.git
cd ReelMark
pnpm install
cp .env.example .env.local   # then fill in the values (see Configuration)
pnpm dev                     # http://localhost:3000
```

The database schema lives on the Supabase project (15 tables). To recreate it, follow [DATA-MODEL.md](./DATA-MODEL.md); the full setup is in [SETUP.md](./SETUP.md).

### Configuration

All variables live in `.env.local` (template: `.env.example`). `NEXT_PUBLIC_*` values reach the browser and are inlined at build time; the rest stay on the server.

| Variable                                                             | Scope  | Description                                                                           |
| :------------------------------------------------------------------- | :----- | :------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                                           | public | Supabase project URL                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                      | public | Supabase publishable key                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`                                          | server | Supabase admin key — never exposed to the client                                      |
| `TMDB_READ_ACCESS_TOKEN`                                             | server | TMDB API v4 read access token                                                         |
| `WATCHMODE_API_KEY`                                                  | server | Watchmode API key (streaming providers)                                               |
| `NEXT_PUBLIC_BASE_URL`                                               | public | Site URL, e.g. `https://reelmark.silexio.be`                                          |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`                 | mixed  | Web Push key pair (`npx web-push generate-vapid-keys`)                                |
| `VAPID_SUBJECT`                                                      | server | Web Push contact, `mailto:…`                                                          |
| `CRON_SECRET`                                                        | server | Bearer token expected by `/api/cron/*`; unset = routes closed                         |
| `BUGSINK_ALERT_SECRET` / `LINEAR_API_KEY` / `LINEAR_TEAM_ID`         | server | Bugsink → Linear relay (`/api/bugsink-alert/<secret>`); any unset = route answers 404 |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`                              | mixed  | Bugsink DSN — must be `https`                                                         |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_URL` / `SENTRY_AUTH_TOKEN` | build  | Source map upload; skipped when the token is unset                                    |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`                             | test   | Dedicated account for authenticated E2E tests and screenshots                         |

### Scripts

| Command            | Description                                                                 |
| :----------------- | :-------------------------------------------------------------------------- |
| `pnpm dev`         | Development server                                                          |
| `pnpm build`       | Production build — `next build --webpack`, required by Serwist              |
| `pnpm start`       | Production server                                                           |
| `pnpm lint`        | ESLint                                                                      |
| `pnpm format`      | Prettier                                                                    |
| `pnpm test`        | Unit tests (Vitest)                                                         |
| `pnpm test:watch`  | Unit tests in watch mode                                                    |
| `pnpm test:e2e`    | E2E tests (Playwright) — expects a server on `:3000`                        |
| `pnpm test:e2e:ui` | E2E tests in the Playwright UI                                              |
| `pnpm screenshots` | Regenerates the README and manifest screenshots (`scripts/screenshots.mjs`) |

The build must use webpack: `@serwist/next` does not support Turbopack, and a Turbopack build ships no `sw.js` and no service-worker registration.

`pnpm screenshots` captures production by default (`SCREENSHOTS_BASE_URL` to point elsewhere). With `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env.local`, it also captures the home, library and AI-assistant pages; without them it only uses public pages. It writes `docs/assets/screenshots/` and `public/screenshots/` — keep `app/manifest.ts` in sync with the files it lists.

### Project structure

```
ReelMark/
├── app/
│   ├── [lang]/             # Localized pages (fr/en): landing, movie, tv, crew, explorer, dashboard, library, settings…
│   ├── actions/            # Server Actions — every mutation
│   ├── api/                # search · cron/* (scheduled jobs) · mcp/[key] (AI assistant) · health
│   ├── auth/               # OAuth callback, email confirmation
│   ├── service-worker.ts   # Serwist service worker
│   └── globals.css         # Design tokens (@theme inline)
├── components/             # media/ · dashboard/ · library/ · profile/ · settings/ · navigation/ · layout/ · ui/
├── lib/                    # tmdb/ · watchmode/ · supabase/ · data/ · mcp/ · recommendations/ · i18n/ · proxy/ …
├── hooks/                  # Client hooks
├── types/                  # Shared types (database.ts is generated)
├── scripts/                # screenshots.mjs
├── k8s/                    # Kubernetes manifests
├── docs/                   # Developer documentation
├── Dockerfile              # Multi-stage image (output: standalone)
└── tests/                  # unit/ (Vitest) · e2e/ (Playwright)
```

### Deployment

Production runs on Infomaniak Public Cloud (managed Kubernetes) behind Cloudflare (TLS, CDN, WAF). The image is published to ghcr.io by GitHub Actions once the CI of a push to `main` succeeds. Step-by-step runbook: [DEPLOYMENT.md](../DEPLOYMENT.md).

Infomaniak only provides the control plane: install Cilium (CNI) and the OpenStack CCM first ([DEPLOYMENT.md § 2](../DEPLOYMENT.md)), otherwise nodes stay `NotReady`.

### Documentation

- [docs/](./README.md): [architecture](./ARCHITECTURE.md) · [setup from scratch](./SETUP.md) · [data model](./DATA-MODEL.md) · [debugging](./DEBUGGING.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md) · [SECURITY.md](../SECURITY.md) · [CONTRIBUTING.md](../CONTRIBUTING.md)

### License

No open-source license — all rights reserved © SAWKIT. Contact the author for reuse.

---

<a name="français"></a>

## Français

ReelMark est une PWA installable et bilingue (FR/EN) pour suivre films et séries épisode par épisode : notes et critiques, playlists, amis, recommandations personnelles, confidentialité par section et lien pour assistant IA. Elle tourne sur Next.js, avec Supabase pour l'authentification et les données, TMDB et Watchmode pour les données médias.

Les tableaux de la section anglaise (fonctionnalités, stack, configuration, scripts, structure) valent pour les deux langues.

### Démarrage

```bash
git clone https://github.com/TheSawkit/ReelMark.git
cd ReelMark
pnpm install
cp .env.example .env.local   # puis remplir les valeurs (tableau Configuration ci-dessus)
pnpm dev                     # http://localhost:3000
```

Prérequis : Node.js 24+, pnpm 11+, un token TMDB, un projet Supabase et, en option, une clé Watchmode. Le schéma (15 tables) vit sur le projet Supabase : [DATA-MODEL.md](./DATA-MODEL.md) pour le recréer, [SETUP.md](./SETUP.md) pour l'installation complète.

### À savoir

- Le build **doit** passer par webpack (`next build --webpack`) : Serwist ne supporte pas Turbopack.
- `pnpm screenshots` régénère les captures du README et du manifest ; avec `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`, il ajoute les pages connectées.
- Production : Kubernetes managé Infomaniak derrière Cloudflare, image sur ghcr.io, déployée quand la CI d'un push sur `main` a réussi. Runbook : [DEPLOYMENT.md](../DEPLOYMENT.md). Infomaniak ne fournit que le control plane : installer Cilium et le CCM OpenStack d'abord.
- Contribution : branche depuis `dev`, PR vers `main`, Conventional Commits, `pnpm lint && pnpm test && pnpm test:e2e` avant toute PR ([CONTRIBUTING.md](../CONTRIBUTING.md)).

### Licence

Aucune licence open-source — tous droits réservés © SAWKIT.
