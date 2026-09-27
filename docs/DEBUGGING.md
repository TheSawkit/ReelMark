# Débogage

Outils et pièges connus, appris en production. À lire avant de passer une heure sur un problème que quelqu'un a déjà résolu.

## Outils

| Besoin                              | Outil                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Erreurs client/serveur/edge en prod | Bugsink (`sentry.silexio.be`) — protocole Sentry                                                   |
| Logs des pods                       | `export KUBECONFIG=~/.kube/pck-6doofpd-kubeconfig` puis `kubectl logs -n reelmark deploy/reelmark` |
| Santé de l'app                      | `curl https://reelmark.silexio.be/api/health`                                                      |
| Requêtes/policies Supabase          | Dashboard Supabase → SQL Editor / Logs ; `pg_policies` pour la RLS                                 |
| Tests ciblés                        | `pnpm test -- <pattern>` · `pnpm test:e2e -- --grep "<titre>"`                                     |

## Pièges connus (classés par symptôme)

### Build / PWA

- **Pas de `sw.js` après build, PWA morte** → le build a tourné sous Turbopack. Serwist exige webpack : `pnpm build` = `next build --webpack`. Ne jamais « simplifier » ce script.
- **Blur cassé sur Chrome après build** → lightningcss fusionne `backdrop-filter` : écrire `-webkit-backdrop-filter` **avant** la propriété standard dans `globals.css`, sinon la standard est supprimée.
- **`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` dans Docker** → le stage deps du Dockerfile doit copier `pnpm-workspace.yaml` (contient `overrides` + `allowBuilds`).
- **PWA qui flashe et se recharge toute seule** → trois causes corrigées le 2026-07-17, à ne pas réintroduire : (1) `experimental.viewTransition` — crash dur iOS Safari (facebook/react#35336) ; (2) `reloadOnOnline` de `@serwist/next` (défaut `true`) — `location.reload()` à chaque bascule réseau, désactivé dans `next.config.ts` ; (3) `backdrop-filter` répété par carte/épisode — plafond mémoire GPU dépassé sur mobile, WebKit tue la page. Le verre est réservé aux singletons (navbar, bottom bar, boutons de hero, dialogs) ; les éléments répétés utilisent `bg-poster-overlay-heavy`/`bg-surface`.
- **Splash screen absent** → Android : il faut une icône 512 `purpose: any` dans le manifest (la maskable seule ne suffit pas). iOS : les `apple-touch-startup-image` sont capturées **à l'installation** — supprimer puis réinstaller la PWA après tout changement de splash.
- **Backdrop de page détail** → toujours `w1280`, jamais `original` (3840px ≈ 30 Mo décodés par page, s'empile en navigation). L'extraction de couleur passe par `getColorSampleUrl()` (`w300`).

### Auth / redirections

- **Login OAuth qui atterrit sur un ancien domaine** → deux causes possibles, dans l'ordre : (1) Site URL / Redirect URLs obsolètes dans Supabase (Authentication → URL Configuration) ; (2) `NEXT_PUBLIC_BASE_URL` périmé **inliné dans l'image au build** — vérifier avec `curl <domaine>/sitemap.xml` (les URLs du sitemap révèlent le BASE_URL baké). Fix : corriger le secret GitHub et rebuilder l'image.
- **Redirect vers `localhost:3000` en prod** → `NEXT_PUBLIC_BASE_URL` absent au build (fallback de `lib/metadata.ts`).
- **`/api/*` redirigé vers `/en/api/*`** → `proxy.ts` doit court-circuiter les chemins `/api` et `/auth` avant le redirect locale (c'est le cas — ne pas le casser).
- **Déconnecté au hasard, renvoyé sur la page de connexion alors que le compte est connecté** → la session n'a pas été rafraîchie par `proxy.ts`. Un Server Component (la navbar, par exemple) ne peut pas écrire de cookies : s'il rafraîchit lui-même un jeton expiré, le refresh token tourné est perdu, et sa réutilisation suivante révoque toute la session. Le proxy appelle `getSession()` (pages publiques) ou `getUser()` (pages protégées) sur toute page portant un cookie de session et recopie les jetons dans la requête transmise — ne pas retirer cet appel ni ajouter de code entre `createServerClient` et lui.
- **Toast « Erreur — réessaie » juste avant d'arriver sur la connexion** → une action à compte appelée sans session redirige, et la promesse côté client rejette avec le signal de redirection. Tout `catch` d'appel d'action affiche son erreur via `toastActionError(err, message)` (`lib/action-toast.ts`), qui se tait sur ce signal, ou passe par l'option `errorToast` de `useAsyncAction`.

### i18n / UI

- **Texte centré dans un bouton qui passe sur deux lignes** → un `<button>` centre son texte par défaut ; ajouter `text-left` aux entrées de liste ou de menu (cas de la nav des Réglages).
- **Titres affichés en serif** → la police n'a pas chargé et le repli métrique de next/font vise Arial, absent de certains systèmes. Les piles de `globals.css` se terminent par une famille générique ; ne pas passer par l'option `fallback` de next/font, qui supprime ce repli métrique (et le gain de CLS).
- **Erreur CSP sur `static.cloudflareinsights.com`** → beacon Cloudflare Web Analytics injecté par le proxy Cloudflare ; il est autorisé dans `script-src` (`next.config.ts`).

- **Chaîne affichée en dur** → interdit ; tout passe par `lib/i18n/translations.ts`. Si TypeScript ne se plaint pas, la clé manque dans les deux langues.
- **Skeleton qui ne ressemble pas à la page** → chaque `loading.tsx` compose les `*Skeleton.tsx` co-localisés ; quand on modifie un composant, mettre à jour son skeleton dans le même dossier.
- **Styles Tailwind qui ne s'appliquent pas** → v4 CSS-first : pas de `tailwind.config.js`, pas de syntaxe v3 (`theme()`, `ease-(--ease-apple)` → `ease-apple`). Un `line-height` posé par une classe du layer `components` sera écrasé par les utilities `text-*` — d'où le `leading-none` explicite à côté de `.heading-display`.

### Kubernetes / déploiement

Voir [`DEPLOYMENT.md`](../DEPLOYMENT.md) pour le runbook complet. Les trois pannes déjà vécues :

- **Nodes `NotReady`, tous les pods `Pending`, kube-system quasi vide** → Cilium (CNI) pas installé. Infomaniak ne fournit que le control plane.
- **CCM OpenStack en CrashLoopBackOff (401)** → le `clouds.yaml` téléchargé depuis Infomaniak a un **password vide par design** ; et l'`auth-url` doit finir par `/v3`. Recréer le secret `cloud-config` avec le password rempli.
- **`EXTERNAL-IP <pending>` pour toujours** → CCM absent ou mal configuré (section `[LoadBalancer]` : `floating-network-id` = réseau `ext-floating1`, `subnet-id` = subnet du cluster).
- **`kubectl` qui parle à `127.0.0.1`** → le contexte par défaut est `orbstack` (local). `export KUBECONFIG=~/.kube/pck-6doofpd-kubeconfig`.
- **HPA `cpu: <unknown>`** → metrics-server non installé sur le cluster.
- **Pods en CrashLoop, exit 139 toutes les ~15 min** → ce n'est pas un segfault : `kubectl logs --previous` montre `JavaScript heap out of memory` vers 750 Mo. Vécu en 2026-09 (3 270 restarts) : l'image tournait en Node 22 alors que `.nvmrc` et la CI sont en 24, et Node 22 fuit sous le crawl des bots (reproduit en local en 150 s). Toute montée de Node touche `.nvmrc`, `ci.yml` **et** `Dockerfile` ensemble ; reproduire une fuite avec la version Node de l'image, pas celle du Mac.
- **`Failed to update prerender cache … ENOENT/EROFS` à chaque page** → le rootfs est en lecture seule et l'ISR écrit dans `.next/server/app`. `experimental.isrFlushToDisk: false` garde le cache en mémoire (LRU borné) — mesuré : même RSS, zéro erreur.
- **Push ghcr refusé** → le nom d'image doit être en minuscules (`ghcr.io/thesawkit/reelmark`) et le token doit avoir `write:packages` (le PAT du pull secret est read-only ; la CI utilise `GITHUB_TOKEN`).

### Assistant IA (MCP)

- **L'assistant n'arrive pas à se connecter en production alors que `curl` fonctionne** → vérifier que les protections anti-bots de Cloudflare (Bot Fight Mode, challenges JavaScript) ne s'appliquent pas à `/api/mcp/*` : Claude, ChatGPT et les autres appellent depuis leurs serveurs et ne peuvent pas résoudre un challenge. Ajouter une règle d'exception sur ce chemin si besoin.
- **Le lien répond `404`** → lien régénéré ou révoqué (un seul lien actif par compte), ou mal copié : le segment doit faire 43 caractères base64url.
- **`429` côté assistant** → budget épuisé : 30 appels d'outils par minute, 100 par jour et par utilisateur (`lib/mcp/budget.ts`). Le reste du protocole ne compte pas. Budgets en mémoire, par pod.
- **L'assistant ne voit pas un changement fait dans l'app** → les goûts sont en cache 2 min par utilisateur (`lib/mcp/user-cache.ts`) ; une écriture par `update_library` vide ce cache, une écriture depuis l'app non. La langue et la région le sont 10 min.
- **Tester à la main** → `POST` JSON-RPC sur `/api/mcp/<clé>` avec `Accept: application/json, text/event-stream` ; `GET` et `DELETE` répondent `405` (serveur sans état).

### Notifications / push

- **Aucun push reçu sur un appareil** → vérifier que l'appareil a une ligne dans `push_subscriptions` (endpoint `fcm.googleapis.com` = Chrome/Android, `web.push.apple.com` = iOS installé). Brave refuse l'abonnement (`AbortError: push service error`) tant que « Utiliser les services Google pour la messagerie push » est désactivé ; les réglages l'affichent désormais.
- **Badge de la cloche faux** → le compteur vit dans `NotificationsProvider` et se resynchronise au retour visible de l'app et à chaque reconnexion realtime. Ne pas compter sur l'événement realtime `DELETE` : Supabase ne le filtre que si la table est en `replica identity full`.
- **Une notification disparaît de la cloche** → seuls « Marquer comme vu » et la suppression la sortent des non-lues ; l'ouvrir ne la marque pas.

### Données

- **« Fuite » de playlists/watchlist suspectée** → lire le modèle de visibilité dans [DATA-MODEL.md](./DATA-MODEL.md) : playlists filtrées par RLS, watchlist/reviews filtrées en applicatif. Vérifier `pg_policies` avant de conclure.
- **Série jamais marquée « vue » malgré tous les épisodes cochés** → TMDB a réduit le nombre d'épisodes ; la comparaison utilise `>=` précisément pour ça (`app/actions/episodes.ts`).
- **Avatar manquant dans une liste** → `user_profiles.avatar_url` est la seule source. Ne pas réintroduire d'appel `auth.admin.getUserById` en fallback.

## Reproduire un bug prod en local

1. `pnpm build && pnpm start` (prod locale, service worker actif — tester en navigation privée pour éviter un SW périmé).
2. Vider le SW : DevTools → Application → Service Workers → Unregister, puis hard reload.
3. Les E2E authentifiés utilisent `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` — un compte de test dédié, jamais un compte réel.
