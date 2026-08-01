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

## 7 bis. Cloisonnement réseau (optionnel, à poser à la main)

`k8s/network-policy.yaml` passe le namespace en default-deny et n'ouvre que trois flux : entrée
depuis `ingress-nginx` sur 3000, DNS vers `kube-system`, et HTTPS sortant **hors plages RFC1918**.
Un pod compromis ne peut donc ni scanner le cluster, ni joindre l'API server.

Volontairement hors CI : une erreur de périmètre coupe l'app sans message clair.

```bash
kubectl apply -f k8s/network-policy.yaml
kubectl -n reelmark logs -l app=reelmark --tail=50   # guetter les timeouts Supabase/TMDB
curl -I https://reelmark.silexio.be
kubectl delete -f k8s/network-policy.yaml            # retour arrière immédiat
```

Prérequis : Cilium applique les NetworkPolicy standard, c'est déjà le CNI du cluster. Le seul
point à vérifier avant de poser la policy est **Bugsink** (`sentry.silexio.be`) : la règle suppose
qu'il est joignable par IP publique. S'il est hébergé sur une IP privée du même Public Cloud, il
faut lui ajouter un `to.ipBlock` dédié, sinon les rapports d'erreur partent en silence.

## 7 ter. L'origine est joignable en direct — à traiter

Le LB Octavia a une IP publique. Qui la connaît peut taper l'origine sans passer par Cloudflare,
donc sans WAF, sans cache, et **sans le rate limiting**. Le cas le plus gênant :
`lib/rate-limiter.ts` lit `cf-connecting-ip` en premier, un header qu'un appelant direct forge
librement — il peut donc à la fois usurper une IP et remettre son compteur à zéro à chaque requête.

**Étape 1 — vérifier que nginx voit la vraie IP source.** Derrière un LoadBalancer Octavia en
`externalTrafficPolicy: Cluster` (le défaut), le SNAT remplace l'IP du client par celle du nœud :
la whitelist rejetterait alors tout le trafic, y compris légitime.

```bash
kubectl -n ingress-nginx logs -l app.kubernetes.io/component=controller --tail=20
```

Si l'IP en début de ligne appartient à Cloudflare, passer à l'étape 2. Si c'est une adresse en
`172.21.x.x` (le subnet du cluster), il faut d'abord passer le Service en
`externalTrafficPolicy: Local` ou activer le PROXY protocol côté Octavia — sinon la whitelist
coupe le site.

**Étape 2 — poser la whitelist**, plages lues depuis [la source officielle][cf-ips] plutôt que
recopiées dans le dépôt, où elles se périmeraient en silence :

```bash
CF=$(curl -s https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6 | paste -sd, -)
kubectl -n reelmark annotate --overwrite ingress reelmark \
  nginx.ingress.kubernetes.io/whitelist-source-range="$CF"

curl -I https://reelmark.silexio.be        # doit répondre 200
kubectl -n reelmark annotate ingress reelmark \
  nginx.ingress.kubernetes.io/whitelist-source-range-   # retour arrière
```

L'annotation survit aux déploiements : `infra.yml` applique l'Ingress en `--server-side`, et
Server-Side Apply ne touche pas aux champs qu'un autre field manager possède. À rejouer quand
Cloudflare publie de nouvelles plages — quelques fois par an.

[OPINION] L'alternative sans liste à maintenir est [Authenticated Origin Pulls][cf-mtls] : mTLS
entre Cloudflare et l'origine, via les annotations `auth-tls-*` de l'Ingress. Plus robuste, plus
long à câbler — à privilégier si les mises à jour de plages IP deviennent pénibles.

[cf-ips]: https://www.cloudflare.com/ips/
[cf-mtls]: https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/

## 7 quater. Surveillance

Bugsink couvre les erreurs applicatives, rien ne couvre l'infrastructure : un pod qui redémarre en
boucle, un HPA plafonné ou un nœud plein passent inaperçus jusqu'à ce qu'un visiteur le signale.

[OPINION] Un `kube-prometheus-stack` in-cluster consommerait environ 1 Go de RAM, soit un quart de
la capacité utile de deux nœuds — disproportionné ici. Un contrôle externe sur `/api/health`
(Cloudflare Health Checks, ou tout service d'uptime) donne l'essentiel du bénéfice sans rien
prendre au cluster, et surveille la chaîne complète plutôt que le seul intérieur du cluster.

Ce qu'un `kubectl` ne dira pas tout seul, à regarder après chaque incident :

```bash
kubectl -n reelmark get pods -o wide                       # redémarrages, répartition sur les nœuds
kubectl -n reelmark describe hpa reelmark | tail -20       # décisions de scaling et leur raison
kubectl top nodes                                          # marge réelle par nœud
kubectl get events -A --sort-by=.lastTimestamp | tail -30  # évictions, drains, OOMKill
```

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

**`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** — à générer une fois, puis à ne plus jamais changer :

```bash
openssl rand -base64 32
```

Next chiffre les variables capturées par une Server Action avant de les envoyer au client, avec
une clé tirée à chaque build par défaut. Pendant un rolling update les deux versions coexistent :
une action chiffrée par l'ancien pod ne se déchiffre pas sur le nouveau, et l'utilisateur reçoit
« Failed to find Server Action ». Une clé fixe supprime la fenêtre. Le build passe sans le secret,
avec un avertissement.

Le workflow passe aussi `NEXT_DEPLOYMENT_ID=${{ github.sha }}` en build-arg. Next suffixe alors
les assets en `?dpl=<sha>` et compare l'identifiant du client à celui du serveur : en cas
d'écart, il déclenche un rechargement complet au lieu de demander un chunk qui n'existe plus.
C'est le correctif de fond des 404 pendant un déploiement — l'affinité par cookie ne faisait
qu'en réduire la probabilité.

Les secrets **serveur** (`SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `TMDB_READ_ACCESS_TOKEN`, `WATCHMODE_API_KEY`) vivent **uniquement** dans le secret K8s `reelmark-secrets`, jamais dans l'image.

## 9. Vérifier

```bash
kubectl -n reelmark get pods,svc,ingress,hpa
curl -I https://reelmark.silexio.be
```

---

## Notes

- **Build** : reste `next build --webpack` (Serwist ne supporte pas Turbopack). Le Dockerfile l'exécute via `pnpm build`. Le stage deps copie `pnpm-workspace.yaml` (il contient `overrides: postcss` + `allowBuilds`) — sinon `pnpm install --frozen-lockfile` échoue (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`).
- **Images** : `next.config.ts` est passé en `images.unoptimized: true` → pods légers, pas de
  `sharp`. Les posters sont servis **directement par le CDN de TMDB** (`image.tmdb.org`), déjà
  dimensionnés par URL (`w92`, `w500`…). Ils ne traversent donc jamais le proxy Cloudflare du
  domaine : **Polish ne s'y applique pas**, il ne couvre que les images servies par l'origine.
  Conséquence assumée — les posters restent en JPEG là où de l'AVIF ferait 30 à 40 % de moins.
  Les deux façons d'y remédier coûtent plus qu'elles ne rapportent à ce dimensionnement : rendre
  `unoptimized` et ajouter `sharp` déplace le resize dans des pods à 2 vCPU (le CPU même qui
  déclenche le HPA), et un loader `/cdn-cgi/image/` demande Cloudflare Image Resizing, payant.
- **NEXT_PUBLIC_*** : injectés au **build** (inlinés dans le bundle client) ET présents au runtime (SSR). Les secrets serveur sont runtime-only.
- **Probes** : `/api/health` (route `app/api/health/route.ts`). Un `startupProbe` couvre le
  démarrage (60 s max) ; readiness et liveness ne s'activent qu'ensuite, donc un boot lent sur un
  nœud chargé ne peut plus déclencher un CrashLoopBackOff. L'endpoint ne touche volontairement
  aucune dépendance externe : une liveness qui teste Supabase ferait redémarrer tous les pods le
  jour où Supabase ralentit.
- **Streaming** : `proxy-buffering: 'off'` sur l'Ingress. nginx bufferise les réponses upstream
  par défaut et attend la réponse complète, ce qui annule le streaming des sections `<Suspense>`
  des fiches détail — la bannière ne peint plus avant les données Supabase.
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
- **Durcissement** : le pod satisfait le profil [Pod Security Standard `restricted`][pss] —
  `runAsNonRoot` en uid/gid 1001 (l'utilisateur créé par le Dockerfile), `seccompProfile:
RuntimeDefault`, `allowPrivilegeEscalation: false`, toutes les capabilities retirées,
  `readOnlyRootFilesystem: true` et `automountServiceAccountToken: false` (l'app ne parle jamais
  à l'API Kubernetes). Deux `emptyDir` bornés couvrent les seuls chemins que le serveur
  standalone écrit : `/app/.next/cache` et `/tmp`. Le `fsGroup: 1001` du pod est ce qui les rend
  inscriptibles — sans lui un `emptyDir` reste `root:root` en 0755 et le conteneur non-root
  échoue au premier write de cache.
- **Arrêt** : Next termine les requêtes en vol **et les callbacks `after()`** avant de sortir sur
  SIGTERM, et [demande un drain de 10 à 30 s][self-host]. Toutes les Server Actions du projet
  déferrent leur revalidation dans `after()`, d'où `terminationGracePeriodSeconds: 45` (10 s de
  `preStop` pour sortir du Service, puis 35 s de drain).
- **Probes** : `timeoutSeconds` vaut 1 s par défaut, ce qui suffit à faire redémarrer un pod dont
  l'event loop est simplement occupé à rendre du SSR — le grand classique de la [panne en
  cascade provoquée par la liveness probe][breck]. Les seuils retenus tolèrent 60 s
  d'indisponibilité franche avant de conclure à un blocage réel.

[pss]: https://kubernetes.io/docs/concepts/security/pod-security-standards/
[self-host]: https://nextjs.org/docs/app/guides/self-hosting
[breck]: https://blog.colinbreck.com/kubernetes-liveness-and-readiness-probes-how-to-avoid-shooting-yourself-in-the-foot/

## Sources

- [Infomaniak Public Cloud — Kubernetes](https://docs.infomaniak.cloud/tutorials/kubernetes/kubernetes_services/)
- [Kubernetes service (offre)](https://www.infomaniak.com/en/hosting/public-cloud/kubernetes)
- [Repo tutoriel Infomaniak](https://github.com/Infomaniak/Public_Cloud_Kubernetes)
- [Docs Public Cloud](https://docs.infomaniak.cloud/)
