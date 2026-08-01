# Déploiement ReelMark — Infomaniak Public Cloud (Kubernetes)

Architecture :

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

- Control plane managé (facturé) + 1 node pool en `a2-ram4-disk20-perf1` (2 vCPU / 4 Go / 20 Go).
- L'autoscaling du node pool Infomaniak va de 1 à 10, non configurable. **Le plancher de 2 nœuds
  est imposé côté cluster**, par l'anti-affinité `required` des deux replicas d'`ingress-nginx`
  (`k8s/ingress-nginx-values.yaml`) : ils ne peuvent pas partager un nœud, donc le cluster
  autoscaler ne peut pas redescendre à 1. Sans ce plancher, `ingress-nginx`, `coredns` et les pods
  applicatifs tiennent sur le même nœud et chaque scale-down coupe le service 10–30 s
  (Cloudflare 1016/523, puis 404 « default backend » le temps que l'ingress resynchronise).
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

**b) OpenStack cloud-controller-manager (CCM)** — il **retire le taint** `uninitialized`, pose les `providerID`/INTERNAL-IP des nodes **et** provisionne les LoadBalancer **Octavia** (sans lui, `EXTERNAL-IP` reste `<pending>` pour toujours).

Pièges vécus en production (2026-07) :

- Le `clouds.yaml` téléchargé depuis le Manager Infomaniak a un **`password` vide par design** → le remplir à la main, sinon le CCM crash-loop en 401.
- L'`auth-url` du fichier omet le suffixe de version → utiliser `https://api.pub1.infomaniak.cloud/identity/v3`.
- La section `[LoadBalancer]` du `cloud.conf` doit pointer : `floating-network-id` = ID du réseau externe `ext-floating1`, `subnet-id` = ID du subnet du cluster (`k8s-clusterapi-cluster-<id>`, 172.21.0.0/16). Les deux se trouvent via l'API Neutron ou Horizon.

```bash
kubectl -n kube-system create secret generic cloud-config --from-file=cloud.conf

helm repo add cpo https://kubernetes.github.io/cloud-provider-openstack
helm install openstack-ccm cpo/openstack-cloud-controller-manager -n kube-system \
  --set cluster.name=<nom-cluster> \
  --set 'nodeSelector=null' \
  --set secret.enabled=true --set secret.name=cloud-config --set secret.create=false
```

(`nodeSelector=null` car le chart cible par défaut les nodes control-plane, invisibles sur un cluster managé.)

Vérifier avant de continuer : `kubectl get nodes -o wide` → **`Ready` + INTERNAL-IP renseignée**, et `kubectl get pods -n kube-system` → `cilium-*` + `openstack-cloud-controller-manager-*` en `Running`.

**c) metrics-server** — requis par le HPA (`k8s/app.yaml`), non fourni :

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Sans lui, `kubectl get hpa -n reelmark` affiche `cpu: <unknown>` et l'autoscaling est inactif.

## 3. Ingress + LoadBalancer

Géré par `.github/workflows/infra.yml` (déclenché par un changement de
`k8s/ingress-nginx-values.yaml` ou `k8s/ingress.yaml`, sinon `workflow_dispatch`). Pour le premier
bootstrap, avant que les secrets GitHub existent, la même commande à la main :

```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --version 4.15.1 \
  --namespace ingress-nginx --create-namespace \
  --values k8s/ingress-nginx-values.yaml
```

La version du chart est pinnée dans `.github/workflows/infra.yml` (`CHART_VERSION`) : une version
flottante ferait passer l'edge en majeure au premier déclenchement du workflow, sans revue.

Le second replica reste `Pending` tant que le cluster n'a qu'un nœud : c'est le signal attendu,
le cluster autoscaler en provisionne un second dans la foulée.

Le Service `LoadBalancer` provisionne un **LB Octavia** (facturé). Récupérer son IP publique :

```bash
kubectl -n ingress-nginx get svc ingress-nginx-controller -o wide
```

## 4. Cloudflare (edge)

1. **DNS** : enregistrement `A` `reelmark.silexio.be` → IP du LB Octavia, **proxy activé (orange)**.
2. **SSL/TLS** : mode **Full (strict)**. Créer un **Origin Certificate** (Cloudflare → SSL/TLS → Origin Server), puis :
    ```bash
    kubectl -n reelmark create secret tls reelmark-tls \
      --cert=origin.pem --key=origin.key
    ```
3. **Images** : activer **Polish** (WebP/AVIF auto) + **Cache** — remplace l'optim in-pod (voir note images plus bas).
4. **WAF** : activer les règles managées de base.
5. **Cache Rule sur les assets** (Rules → Cache Rules) : expression
   `starts_with(http.request.uri.path, "/_next/static/")` → _Eligible for cache_,
   Edge TTL 1 an. Ces fichiers sont immutables (hachés par build). C'est l'optimisation la plus
   rentable du setup : elle sort les assets des pods et fait tomber la charge CPU qui déclenche
   le HPA.

## 5. Registry ghcr.io — pull secret

Rendre le package public (simple) **ou** créer un pull secret :

```bash
kubectl -n reelmark create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=thesawkit \
  --docker-password=YOUR_GITHUB_PAT   # scope read:packages
```

## 6. Secrets applicatifs (runtime)

Créer le secret `reelmark-secrets` (ne pas committer les vraies valeurs — cf. `k8s/secret.example.yaml`) :

```bash
kubectl -n reelmark create secret generic reelmark-secrets \
  --from-env-file=.env.production
```

`.env.production` contient les mêmes clés que `.env.local` (DSN Sentry en **https**).

## 7. Déployer les manifests

`k8s/app.yaml` porte le placeholder `__IMAGE_TAG__` au lieu d'un tag figé : le CI y substitue le
SHA du commit. Un `kubectl apply` brut échouerait en `ImagePullBackOff` — c'est voulu, ça vaut
mieux qu'un `:latest` qui reverte silencieusement le cluster sur une image inconnue.

```bash
sed "s|__IMAGE_TAG__|$(git rev-parse HEAD)|g" k8s/app.yaml \
  | kubectl apply --server-side --force-conflicts -f -
kubectl -n reelmark rollout status deployment/reelmark
```

`--server-side` n'est pas cosmétique : voir la section 8 pour la raison (`spec.replicas` appartient
au HPA). `k8s/ingress.yaml` n'est pas dans ce bloc — il est déployé par
`.github/workflows/infra.yml`, l'edge ne doit pas bouger à chaque push de code.

## 8. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` build l'image, la push sur ghcr.io, puis **applique `k8s/app.yaml`**
avec le SHA substitué à chaque push sur `main`. Le déploiement est déclaratif : toute modification
des resources, probes, PDB ou HPA part en prod avec le commit qui la contient — inutile de
réappliquer à la main.

Corollaire : le Deployment ne déclare **pas** `spec.replicas`. Ce champ appartient au HPA ; le
laisser dans le manifeste ramènerait le nombre de pods à sa valeur écrite à chaque déploiement,
annulant l'autoscaling en pleine charge. L'apply se fait donc en **`--server-side`** : en
client-side, l'absence du champ le remettrait à son défaut (1 pod) à chaque déploiement, alors
qu'en server-side il reste la propriété du field manager `horizontal-pod-autoscaler`.
`--force-conflicts` est nécessaire une fois, pour reprendre les champs encore détenus par
l'ancien manager `kubectl-client-side-apply`.

Deux workflows, deux rythmes :

| Workflow                       | Déclencheur                          | Portée                                     |
| ------------------------------ | ------------------------------------ | ------------------------------------------ |
| `.github/workflows/deploy.yml` | tout push sur `main`                 | image + `k8s/app.yaml`                     |
| `.github/workflows/infra.yml`  | changement des fichiers edge, manuel | chart `ingress-nginx` + `k8s/ingress.yaml` |

**Secrets GitHub à définir** (Settings → Secrets → Actions) :

| Secret                          | Rôle                        |
| ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | build-arg (client)          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build-arg (client)          |
| `NEXT_PUBLIC_BASE_URL`          | build-arg (client)          |
| `NEXT_PUBLIC_SENTRY_DSN`        | build-arg (client, https)   |
| `KUBECONFIG_B64`                | `base64 -w0 ~/.kube/config` |

Les secrets **serveur** (`SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `TMDB_READ_ACCESS_TOKEN`, `WATCHMODE_API_KEY`) vivent **uniquement** dans le secret K8s `reelmark-secrets`, jamais dans l'image.

## 9. Vérifier

```bash
kubectl -n reelmark get pods,svc,ingress,hpa
curl -I https://reelmark.silexio.be
```

---

## Notes

- **Build** : reste `next build --webpack` (Serwist ne supporte pas Turbopack). Le Dockerfile l'exécute via `pnpm build`. Le stage deps copie `pnpm-workspace.yaml` (il contient `overrides: postcss` + `allowBuilds`) — sinon `pnpm install --frozen-lockfile` échoue (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`).
- **Images** : `next.config.ts` est passé en `images.unoptimized: true` → pods légers, pas de `sharp`. Le resize/format est délégué à **Cloudflare Polish**. Les posters TMDB sont déjà dimensionnés par URL (`w500`, etc.). Pour revenir à l'optim Next in-pod : retirer `unoptimized`, ajouter `sharp` au Dockerfile runner.
- **NEXT_PUBLIC_*** : injectés au **build** (inlinés dans le bundle client) ET présents au runtime (SSR). Les secrets serveur sont runtime-only.
- **Probes** : `/api/health` (route `app/api/health/route.ts`). Un `startupProbe` couvre le
  démarrage (60 s max) ; readiness et liveness ne s'activent qu'ensuite, donc un boot lent sur un
  nœud chargé ne peut plus déclencher un CrashLoopBackOff.
- **Scaling** : HPA 2→10 pods sur CPU 70 % de la request (350m). Le seuil se lit toujours en
  pourcentage de `requests.cpu`, jamais de la limite — une request trop basse fait scaler le HPA
  en permanence et entraîne le node pool dans le même va-et-vient.
- **Dimensionnement (`a2-ram4-disk20-perf1`)** : ~1 500m CPU et ~2 600 Mi restent à l'app par nœud
  une fois kubelet et DaemonSets déduits, soit **2 pods par nœud** (500m + 1Gi de requests).
  `memory.limit == memory.request` place les pods en QoS Burstable protégée : ils ne sont pas
  candidats à l'éviction avant les BestEffort sous MemoryPressure. `NODE_OPTIONS` borne le heap V8
  à 768 Mo sous la limite de 1 Gi.
- **Disponibilité** : PDB `maxUnavailable: 1` (correct quelle que soit la taille du ReplicaSet,
  contrairement à `minAvailable`) + `topologySpreadConstraints` en `ScheduleAnyway` pour répartir
  les pods sans jamais bloquer le scheduling quand le pool n'a qu'un nœud disponible.

## Sources

- [Infomaniak Public Cloud — Kubernetes](https://docs.infomaniak.cloud/tutorials/kubernetes/kubernetes_services/)
- [Kubernetes service (offre)](https://www.infomaniak.com/en/hosting/public-cloud/kubernetes)
- [Repo tutoriel Infomaniak](https://github.com/Infomaniak/Public_Cloud_Kubernetes)
- [Docs Public Cloud](https://docs.infomaniak.cloud/)
