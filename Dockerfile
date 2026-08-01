# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
# Inlinée dans le bundle client au build : la fournir au runtime seul ne suffit pas,
# pushManager.subscribe() recevrait undefined et le toggle resterait sans effet.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
	NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
	NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
	NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
	NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
	NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Depuis l'activation de Cache Components, le build prérend les shells et remplit les
# entrées "use cache" : il appelle donc TMDB. Le token passe par un secret BuildKit, jamais
# par un ARG — un build-arg resterait lisible dans l'historique de l'image.
RUN --mount=type=secret,id=tmdb_token \
	set -e; \
	test -n "$NEXT_PUBLIC_SUPABASE_URL" || { echo "ERREUR: build-arg 'NEXT_PUBLIC_SUPABASE_URL' vide — le bundle client serait inutilisable." >&2; exit 1; }; \
	test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || { echo "ERREUR: build-arg 'NEXT_PUBLIC_SUPABASE_ANON_KEY' vide — le bundle client serait inutilisable." >&2; exit 1; }; \
	test -n "$NEXT_PUBLIC_BASE_URL" || { echo "ERREUR: build-arg 'NEXT_PUBLIC_BASE_URL' vide — le bundle client serait inutilisable." >&2; exit 1; }; \
	if [ ! -s /run/secrets/tmdb_token ]; then \
		echo "ERREUR: secret de build 'tmdb_token' manquant — le prerender appelle TMDB." >&2; \
		exit 1; \
	fi; \
	TMDB_READ_ACCESS_TOKEN="$(cat /run/secrets/tmdb_token)" pnpm build

FROM base AS runner
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	PORT=3000 \
	HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
