# Contributing to ReelMark

## Workflow

- Branch from `dev`; open pull requests against `main`.
- One concern per PR. Keep diffs minimal and scoped — no opportunistic refactors.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.

```
feat(watchlist): add season progress bar
fix(episodes): use >= for full-season toggle
```

## Before opening a PR

```bash
pnpm format --check
pnpm lint
pnpm test        # Vitest unit tests
pnpm test:e2e    # Playwright — needs TEST_USER_EMAIL / TEST_USER_PASSWORD
pnpm build       # next build --webpack (Serwist requires webpack, not Turbopack)
```

## Code conventions

- **TypeScript strict** — no `any`, `as const` over enums, `unknown` + narrowing.
- **Server Components by default** — `'use client'` only for events, hooks, or browser APIs.
- **All mutations via Server Actions** (`app/actions/`), authenticated with `getAuthenticatedUser()`. Never call Supabase/TMDB from a client component.
- **No hardcoded UI strings** — everything through `lib/i18n/translations.ts` (EN + FR).
- **Design tokens only** — no arbitrary Tailwind colors (`bg-surface`, not `bg-[#...]`).
- **No inline comments**; docstrings only on public functions (one line, what + why).
- Absolute imports via `@/` — never relative `../../`.

## Database changes

Add a new migration in `supabase/migrations/` (never edit an applied one). Apply via the Supabase SQL editor or CLI. Respect Row-Level Security — see [`context-ai/SECURITY.md`](../context-ai/SECURITY.md) for the visibility model.

## Tests

- Unit: `tests/unit/` (Vitest).
- E2E: `tests/e2e/` (Playwright); authenticated flows in `tests/e2e/protected/`.

## Deployment

Production deployment (Infomaniak Kubernetes) is documented in [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md). A push to `main` triggers the CI build + rollout.
