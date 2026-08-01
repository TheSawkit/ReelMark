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
- **No inline comments**; docstrings only on public functions (one line, what + why).
- Absolute imports via `@/` — never relative `../../`.

## Database changes

The schema lives on the Supabase project (applied via SQL editor or MCP — no versioned .sql files in the repo). Document any schema change in [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) and regenerate `types/database.ts`. Respect Row-Level Security — see the visibility model in that same document.

## Tests

- Unit: `tests/unit/` (Vitest).
- E2E: `tests/e2e/` (Playwright); authenticated flows in `tests/e2e/protected/`.

## Deployment

Production deployment (Infomaniak Kubernetes) is documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md). A push to `main` triggers the CI build + rollout.

## Project documentation

New to the codebase? Start with [`docs/`](./docs/README.md): architecture, full setup from scratch, data model, and a catalog of known pitfalls for debugging.
