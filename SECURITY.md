# Security Policy

## Supported version

Only the version deployed at [reelmark.silexio.be](https://reelmark.silexio.be) — built from `main` — receives fixes. There are no maintained release branches.

## Reporting a vulnerability

Do not open a public issue. Use GitHub private vulnerability reporting:
[github.com/TheSawkit/ReelMark/security/advisories/new](https://github.com/TheSawkit/ReelMark/security/advisories/new) — the same address as [`/.well-known/security.txt`](https://reelmark.silexio.be/.well-known/security.txt) (RFC 9116).

Please include a description, steps to reproduce and the impact you expect. Reports are acknowledged within 48 hours and assessed within 7 days; the fix timeline depends on severity. Disclosure is coordinated once a fix is deployed, and reporters are credited in the advisory unless they prefer otherwise.

## How ReelMark protects data

### Database

- Supabase PostgreSQL with Row-Level Security. Visibility rules (public, friends-only, private per section) are enforced in the database and checked again in application code — see [docs/DATA-MODEL.md](./docs/DATA-MODEL.md#modèle-de-visibilité-important).
- The service-role client (`createAdminClient`) bypasses RLS, so every function that uses it carries its own authorization check. It is used for account creation and deletion, friends lists across users, push notifications and scheduled jobs, public playlist previews, avatar mirroring and the AI-assistant link.

### Authentication and sessions

- Supabase Auth: email and password, magic link, passkeys, Google OAuth. Session cookies are managed by `@supabase/ssr`.
- `proxy.ts` refreshes the session on every page that carries a session cookie and stores the rotated tokens; Server Components never write cookies.
- Every account-only read or write goes through `getAuthenticatedUser()`, which sends signed-out callers to the login page. The post-login `next` parameter only accepts same-site paths (`sanitizeRedirectPath`).

### HTTP

- Security headers on every response (`next.config.ts`): Content-Security-Policy, HSTS with preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict `Referrer-Policy` and a restrictive `Permissions-Policy`.
- Rate limits: `/api/search` per IP, data export and AI-link generation per user, AI-assistant tool calls per user. The AI-assistant budget is counted in Postgres and shared by every pod; the others are in memory and per pod, and `/api/search` is also limited per IP at the Cloudflare edge.
- Scheduled jobs (`/api/cron/*`) require `CRON_SECRET`, compared in constant time; the routes stay closed when the variable is unset.

### AI-assistant link (MCP)

- The link is a 256-bit random secret shown once. Only its SHA-256 hash is stored, and regenerating or revoking it disables the old link immediately.
- Links are read-only unless the user allows changes when generating one. The access is part of the hashed secret (`rw-` prefix), so it cannot be raised by editing a link; a read-only link does not even list the write tool.
- An unknown link gets an empty `404`. A valid link reads the owner's tastes and library; a write link can also change the status of titles in that library — nothing else, and never another user's data.
- Tool calls are limited to 30 per minute and 100 per day per user, across all pods.

### User content

Reviews are stored and rendered as plain text only — no HTML or Markdown rendering. `validateReviewContent` (`lib/validators.ts`) strips control characters, trims whitespace and caps the length before saving, and React escapes the output. Any future rich-text rendering must add a sanitization step.

### Secrets

Server secrets live in `.env.local` locally and in the `reelmark-secrets` Kubernetes secret in production — never in the image. `NEXT_PUBLIC_*` variables are public by design.

## Personal data

- Stored: account (email, username, profile), watch history, ratings and reviews, playlists, friendships, notification and privacy preferences, streaming services, and the hash of the AI-assistant link.
- Users can export their data and delete their account from Settings → Data. Deletion purges every table explicitly (`lib/data/account-purge.ts`) instead of relying on foreign-key cascades, the AI link first.
- TMDB and Watchmode receive no personal data — only public catalogue requests.

## For contributors

- Never commit secrets; keep them in `.env.local`.
- Validate input on the server, even when the client already does.
- Any new table needs RLS; any new use of the service role needs its own authorization check.
- Keep dependencies current and review `pnpm audit` before releases.
