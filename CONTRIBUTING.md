# Contributing to ReelMark

## Workflow

- Branch from `dev`; open pull requests against `main`.
- One concern per PR. Keep diffs minimal and scoped — no opportunistic refactors.

### Merging

| Pull request    | Merge mode                |
| --------------- | ------------------------- |
| `feature → dev` | **Squash and merge**      |
| `dev → main`    | **Create a merge commit** |

Squashing a feature branch is fine — it is short-lived and thrown away afterwards. Squashing
`dev → main` is not: the squash writes a brand-new commit on `main` that does not exist in `dev`,
so git cannot tell the two histories ever met. Every later pull request then relists all the
commits already shipped, and the branches drift further apart with each release.

Once `dev → main` uses a merge commit, resynchronising is a fast-forward — never a reset:

```bash
git checkout dev && git pull   # after the PR is merged
```

If the branches have already drifted, one merge commit is enough to reconcile them; there is
nothing to reset and nothing to force-push.

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
- **Comments explain why**, never what the code already says; docstrings on exported functions.
- Absolute imports via `@/` — never relative `../../`.

## Database changes

The whole schema is versioned in `supabase/migrations/`: `20260101000000_baseline.sql` recreates the production schema as it stood on 2026-09-28 (rebuilt from its catalog), and every later migration follows. A database built from that folder alone matches production (see [`docs/SUPABASE-USAGE.md`](./docs/SUPABASE-USAGE.md#tests-e2e-et-environnement-de-dev)). A schema change is applied to production through the SQL editor or MCP `apply_migration` — never `supabase db push` / `db reset` against it — then committed as `supabase/migrations/<version>_<name>.sql`, `<version>` being the one Supabase recorded. Check it on a local stack first (`supabase start`, `supabase db reset`). Document any schema change in [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) and regenerate `types/database.ts`. Respect Row-Level Security — see the visibility model in that same document. Before adding a query, read [`docs/SUPABASE-USAGE.md`](./docs/SUPABASE-USAGE.md): the project runs on the Free plan and its egress quota has already been exceeded once.

## Tests

- Unit: `tests/unit/` (Vitest).
- E2E: `tests/e2e/` (Playwright); authenticated flows in `tests/e2e/protected/`.

## Deployment

Production deployment (Infomaniak Kubernetes) is documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md). A push to `main` runs the CI; the rollout (`deploy.yml`) starts only once that CI run succeeds, on the exact commit it tested.

## Project documentation

New to the codebase? Start with [`docs/`](./docs/README.md): architecture, full setup from scratch, data model, and a catalog of known pitfalls for debugging.
