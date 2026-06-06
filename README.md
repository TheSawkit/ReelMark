# 🎬 ReelMark

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![CI](https://github.com/TheSawkit/watchlist/actions/workflows/ci.yml/badge.svg)](https://github.com/TheSawkit/watchlist/actions/workflows/ci.yml)

> **Stop wasting hours deciding what to watch.**
> Organize your cinematic life with an interface that actually feels like a theater.

**[🇬🇧 English](#-english) | [🇫🇷 Français](#-français)**

---

<a name="-english"></a>

## 🇬🇧 English

### ✨ Features

|     | Feature                    | Description                                                                   |
| --- | -------------------------- | ----------------------------------------------------------------------------- |
| 🎞️  | **Personal tracking**      | Complete history of your movies, shows, and episodes across every season      |
| 📺  | **Episode-level tracking** | Track every episode — never ask "did we watch this one?" again                |
| 🔍  | **Smart exploration**      | Browse 700k+ titles from the TMDB catalog with intelligent regional filtering |
| ⭐  | **Ratings & reviews**      | Rate on a 1–10 scale and write reviews visible on your public profile         |
| 📁  | **Playlists**              | Create themed collections and share them publicly                             |
| 👥  | **Friends & community**    | Send friend requests, follow friends' watchlists and reviews                  |
| 🎭  | **Crew profiles**          | Full filmographies, biographies, and credits for every crew member            |
| 📱  | **Installable PWA**        | Works on iPhone, Android, Mac, Windows, and Linux — no app store required     |
| 🌍  | **Native bilingualism**    | Instant EN/FR switching with server-side language detection                   |
| 🔒  | **Privacy controls**       | Per-section visibility: public, friends only, or private                      |

---

### 🛠️ Tech Stack

| Layer          | Technology                                 |
| :------------- | :----------------------------------------- |
| **Frontend**   | Next.js 16.2.6 (App Router) + React 19     |
| **Styling**    | Tailwind CSS 4 (token-based design system) |
| **Auth & DB**  | Supabase (PostgreSQL + RLS)                |
| **Media data** | TMDB API                                   |
| **Streaming**  | Watchmode API                              |
| **PWA**        | Serwist (Service Worker + precaching)      |

---

### 🚀 Quick Start

**1. Prerequisites**

- Node.js 24+ and pnpm
- A [TMDB Read Access Token](https://developer.themoviedb.org/docs/getting-started)
- A [Supabase](https://supabase.com) project
- A [Watchmode](https://api.watchmode.com) API key

**2. Clone & install**

```bash
git clone https://github.com/TheSawkit/watchlist.git
cd watchlist
pnpm install
```

**3. Environment variables** — create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
WATCHMODE_API_KEY=your_watchmode_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**4. Database setup**

Run the SQL migrations in order from your Supabase SQL Editor:

1. `supabase/migrations/001_profile_features.sql` — creates `user_profiles`, `privacy_settings`, `reviews`, `playlists`, `playlist_items`, `friendships` with RLS policies.

**5. Launch**

```bash
pnpm dev
```

---

### 📁 Project Structure

```
watchlist/
├── app/                        # Next.js App Router
│   ├── actions/                # Server Actions (all mutations)
│   ├── movie/[id]/             # Movie detail page
│   ├── tv/[id]/                # TV show + season pages
│   ├── crew/[id]/             # Crew detail page
│   ├── explorer/               # Browse & search
│   ├── library/                # User watchlist
│   ├── dashboard/              # User dashboard
│   ├── settings/               # Profile, privacy, preferences
│   ├── manifest.ts             # PWA Web App Manifest
│   ├── service-worker.ts       # Serwist Service Worker
│   └── globals.css             # Design tokens (@theme inline)
├── components/
│   ├── media/                  # WatchButton, EpisodeCard, MediaBanner…
│   ├── ui/                     # shadcn/ui primitives
│   ├── navigation/             # Navbar, NavLinks
│   ├── profile/                # Reviews, playlists sections
│   └── settings/               # Settings sub-components
├── lib/
│   ├── tmdb/                   # TMDB API clients
│   ├── supabase/               # Server & client Supabase helpers
│   ├── i18n/                   # Translations + language context
│   ├── providers/              # App Store icon provider
│   ├── metadata.ts             # Shared OG metadata builder
│   ├── format.ts               # formatDate, calculateAge
│   └── mappers.ts              # TMDB → MediaItem mappers
├── types/                      # Global TypeScript types
├── hooks/                      # useAsyncAction
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright E2E tests
└── supabase/migrations/        # SQL schema migrations
```

---

### 📦 Available Scripts

| Command            | Description                     |
| :----------------- | :------------------------------ |
| `pnpm dev`         | Start dev server with Turbopack |
| `pnpm build`       | Production build                |
| `pnpm start`       | Start production server         |
| `pnpm lint`        | Run ESLint                      |
| `pnpm test`        | Unit tests (Vitest)             |
| `pnpm test:watch`  | Unit tests in watch mode        |
| `pnpm test:e2e`    | E2E tests (Playwright)          |
| `pnpm test:e2e:ui` | E2E tests with Playwright UI    |

---

<a name="-français"></a>

## 🇫🇷 Français

### ✨ Fonctionnalités

|     | Fonctionnalité                  | Description                                                                |
| --- | ------------------------------- | -------------------------------------------------------------------------- |
| 🎞️  | **Suivi personnel**             | Historique complet de tes films, séries et épisodes, saison par saison     |
| 📺  | **Suivi par épisode**           | Suis ta progression réelle — plus jamais "on en était où ?"                |
| 🔍  | **Exploration intelligente**    | 700k+ titres du catalogue TMDB avec filtrage régional pertinent            |
| ⭐  | **Notes et avis**               | Note de 1 à 10 et écris des critiques visibles sur ton profil public       |
| 📁  | **Playlists**                   | Crée des collections thématiques et partage-les                            |
| 👥  | **Amis & communauté**           | Envoie des demandes d'amis, suis les listes et critiques de tes amis       |
| 🎭  | **Profils d'acteurs**           | Filmographies complètes, biographies et crédits pour chaque acteur         |
| 📱  | **PWA installable**             | Fonctionne sur iPhone, Android, Mac, Windows et Linux — aucun store requis |
| 🌍  | **Bilingue natif**              | Bascule EN/FR instantanée avec détection de langue côté serveur            |
| 🔒  | **Contrôle de confidentialité** | Visibilité par section : public, amis uniquement, ou privé                 |

---

### 🛠️ Stack technique

| Couche            | Technologie                            |
| :---------------- | :------------------------------------- |
| **Frontend**      | Next.js 16.2.6 (App Router) + React 19 |
| **Styles**        | Tailwind CSS 4 (système de tokens)     |
| **Auth & DB**     | Supabase (PostgreSQL + RLS)            |
| **Données média** | TMDB API                               |
| **Streaming**     | Watchmode API                          |
| **PWA**           | Serwist (Service Worker + précaching)  |

---

### 🚀 Installation rapide

**1. Prérequis** : Node.js 24+ et pnpm.

**2. Clone & install**

```bash
git clone https://github.com/TheSawkit/watchlist.git
cd watchlist
pnpm install
```

**3. Variables d'environnement** — crée un `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
WATCHMODE_API_KEY=your_watchmode_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**4. Base de données** : Exécute les fichiers `supabase/migrations/*.sql` dans l'ordre depuis ton dashboard Supabase.

**5. Lancer** : `pnpm dev`

---

<p align="center">
  Built with 🍿 by <a href="https://github.com/TheSawkit">SAWKIT</a>
</p>
