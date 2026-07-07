# Migration ReelMark → Infomaniak Public Cloud (Kubernetes)

Architecture cible :

```
Cloudflare (DNS + proxy: TLS, CDN, Polish/AVIF, WAF)
   → Infomaniak LoadBalancer (Octavia)
   → nginx-ingress
   → Service ClusterIP → Deployment (pods Node standalone)
```

Supabase / TMDB / Bugsink restent externes. Registry d'image : **ghcr.io**.

---

## 0. Prérequis

- Projet Public Cloud actif ([docs](https://docs.infomaniak.cloud/)).
- CLI locales : `kubectl`, `helm`, et le client Infomaniak/OpenStack.
- Domaine `reelmark.silexio.be` géré sur Cloudflare.

## 1. Créer le cluster Kubernetes managé

Via le **Manager Infomaniak** (UI) ou l'API/CLI — voir la [doc Kubernetes](https://docs.infomaniak.cloud/tutorials/kubernetes/kubernetes_services/) et le [repo d&#39;exemple Infomaniak](https://github.com/Infomaniak/Public_Cloud_Kubernetes).

- Control plane managé (facturé) + 1 node pool (2–3 instances pour commencer).
- Récupérer le **kubeconfig** depuis le Manager → `~/.kube/config`.
- Vérifier : `kubectl get nodes`.

## ⚠️ 2. Bootstrap réseau OBLIGATOIRE — Cilium (CNI) + CCM OpenStack

Infomaniak fournit le **control plane** mais **pas la couche réseau**. Tant que ce n'est pas fait :

- `kubectl get nodes` → `NotReady` (`cni plugin not initialized`)
- le taint `node.cloudprovider.kubernetes.io/uninitialized` reste
- **aucun pod ne se planifie** (ni ingress, ni app) → tout en `Pending`
- `kubectl get svc -n ingress-nginx` → `EXTERNAL-IP <pending>`

C'est l'étape qui bloque le plus souvent. À faire **avant** d'installer l'ingress. Deux composants, dans l'ordre :

**a) Cilium (CNI)** — en mode `kubeProxyReplacement` (il n'y a pas de kube-proxy sur ce cluster), avec l'IP/port de ton API server :

```bash
# IP:port de l'API :
kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'

helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium -n kube-system \
  --set kubeProxyReplacement=true \
  --set k8sServiceHost=<IP_API> \
  --set k8sServicePort=<PORT_API>
```

**b) OpenStack cloud-controller-manager (CCM)** — crée un secret `cloud-config` depuis ton `clouds.yaml` (Manager Infomaniak → identifiants OpenStack / application credentials), puis applique le CCM. Il **retire le taint** `uninitialized` **et** provisionne les LoadBalancer **Octavia** (sans lui, `EXTERNAL-IP` reste `<pending>` pour toujours).

> Les manifests exacts + le format `cloud.conf` adaptés à Infomaniak sont dans leur repo, dossier `manifest/` : [github.com/Infomaniak/Public_Cloud_Kubernetes](https://github.com/Infomaniak/Public_Cloud_Kubernetes). En cas de doute sur "auto vs manuel", un ticket support Infomaniak confirme le flux.

Vérifier avant de continuer : `kubectl get nodes` → **`Ready`**, et `kubectl get pods -n kube-system` → `cilium-*` + `openstack-cloud-controller-manager-*` en `Running`.

## 3. Ingress + LoadBalancer

```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

Le Service `LoadBalancer` provisionne un **LB Octavia** (facturé). Récupérer son IP publique :

```bash
kubectl -n ingress-nginx get svc ingress-nginx-controller -o wide
```

## 3. Cloudflare (edge)

1. **DNS** : enregistrement `A` `reelmark.silexio.be` → IP du LB Octavia, **proxy activé (orange)**.
2. **SSL/TLS** : mode **Full (strict)**. Créer un **Origin Certificate** (Cloudflare → SSL/TLS → Origin Server), puis :
   ```bash
   kubectl -n reelmark create secret tls reelmark-tls \
     --cert=origin.pem --key=origin.key
   ```
3. **Images** : activer **Polish** (WebP/AVIF auto) + **Cache** — remplace l'optim in-pod (voir note images plus bas).
4. **WAF** : activer les règles managées de base.

## 4. Registry ghcr.io — pull secret

Rendre le package public (simple) **ou** créer un pull secret :

```bash
kubectl -n reelmark create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=thesawkit \
  --docker-password=YOUR_GITHUB_PAT   # scope read:packages
```

## 5. Secrets applicatifs (runtime)

Créer le secret `reelmark-secrets` (ne pas committer les vraies valeurs — cf. `k8s/secret.example.yaml`) :

```bash
kubectl -n reelmark create secret generic reelmark-secrets \
  --from-env-file=.env.production
```

`.env.production` contient les mêmes clés que `.env.local` (DSN Sentry en **https**).

## 6. Déployer les manifests

L'image est déjà réglée (`ghcr.io/thesawkit/reelmark`). Déployer :

```bash
kubectl apply -f k8s/app.yaml
kubectl apply -f k8s/ingress.yaml
kubectl -n reelmark rollout status deployment/reelmark
```

## 7. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` build l'image, la push sur ghcr.io et roll le déploiement à chaque push sur `main`.

**Secrets GitHub à définir** (Settings → Secrets → Actions) :

| Secret                            | Rôle                         |
| --------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | build-arg (client)            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build-arg (client)            |
| `NEXT_PUBLIC_BASE_URL`          | build-arg (client)            |
| `NEXT_PUBLIC_SENTRY_DSN`        | build-arg (client, https)     |
| `KUBECONFIG_B64`                | `base64 -w0 ~/.kube/config` |

Les secrets **serveur** (`SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `TMDB_READ_ACCESS_TOKEN`, `WATCHMODE_API_KEY`) vivent **uniquement** dans le secret K8s `reelmark-secrets`, jamais dans l'image.

## 8. Vérifier

```bash
kubectl -n reelmark get pods,svc,ingress,hpa
curl -I https://reelmark.silexio.be
```

---

## Notes

- **Build** : reste `next build --webpack` (Serwist ne supporte pas Turbopack). Le Dockerfile l'exécute via `pnpm build`. Le stage deps copie `pnpm-workspace.yaml` (il contient `overrides: postcss` + `allowBuilds`) — sinon `pnpm install --frozen-lockfile` échoue (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`).
- **Images** : `next.config.ts` est passé en `images.unoptimized: true` → pods légers, pas de `sharp`. Le resize/format est délégué à **Cloudflare Polish**. Les posters TMDB sont déjà dimensionnés par URL (`w500`, etc.). Pour revenir à l'optim Next in-pod : retirer `unoptimized`, ajouter `sharp` au Dockerfile runner.
- **NEXT_PUBLIC_*** : injectés au **build** (inlinés dans le bundle client) ET présents au runtime (SSR). Les secrets serveur sont runtime-only.
- **Probes** : `/api/health` (route `app/api/health/route.ts`).
- **Scaling** : HPA 2→5 pods sur CPU 70%.

## Sources

- [Infomaniak Public Cloud — Kubernetes](https://docs.infomaniak.cloud/tutorials/kubernetes/kubernetes_services/)
- [Kubernetes service (offre)](https://www.infomaniak.com/en/hosting/public-cloud/kubernetes)
- [Repo tutoriel Infomaniak](https://github.com/Infomaniak/Public_Cloud_Kubernetes)
- [Docs Public Cloud](https://docs.infomaniak.cloud/)
