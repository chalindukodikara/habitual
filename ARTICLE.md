# Production-Grade from Day One: Building Habitual with OpenChoreo

Most side projects die in the gap between "it works on my laptop" and "it runs in production." Not because the code is bad, but because the operational overhead is crushing. You need environment configs, autoscaling, deployment pipelines, health checks, secret management, network policies — and suddenly your weekend project needs a platform team.

Habitual is a full-featured habit tracker with a contribution heatmap, focus timer, streak analytics, achievement badges, radar charts, and per-habit detail views. It's not complex. But deploying it *properly* — with environment-specific configuration, a promotion pipeline, autoscaling, and scheduled background jobs — requires exactly the kind of operational maturity that most teams take months to build.

OpenChoreo gives you that maturity on day one.

## What We're Building

Habitual has four components:

- **Frontend** — A React + Vite app with 5-tab navigation (Today, Activity, Timer, Habits, Stats), dark mode, and desktop-responsive layout. Features include a contribution heatmap, focus timer (Pomodoro), radar charts, habit comparison, per-habit detail pages, floating action button, and achievement badges.
- **Backend API** — A Go service handling habit CRUD (create, read, update with icon/color/frequency, delete), daily completions (toggle on/off), heatmap data, and statistics. Full OpenAPI spec in `openapi.yaml`.
- **PostgreSQL Database** — Stores profiles, habits, completions, streaks, and weekly stats. Seed data includes 8 habits and 180 days of deterministic completion history.
- **Streak Engine** — A daily cronjob (00:05 UTC) that computes current/longest streaks and 30-day completion rates for every habit, plus weekly aggregates per profile.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────>│  Backend API │────>│  PostgreSQL   │
│  (React+Vite)│     │    (Go)      │     │  (Database)   │
│  deployment  │     │  deployment  │     │  statefulset  │
│  external    │     │  project     │     │  project      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                ▲
                                                │
                                         ┌──────────────┐
                                         │  Streak      │
                                         │  Engine      │
                                         │   cronjob    │
                                         └──────────────┘
```

The streak engine is the interesting part. It runs daily, iterating through every active habit, counting consecutive completion days backwards from today, and updating a `streaks` table that the API serves directly. This pattern — precomputing expensive aggregations in a background job rather than calculating them per-request — is common in production systems. And it maps perfectly to OpenChoreo's workload type model.

## The Production Readiness Checklist

When you deploy a serious application, you care about more than "does it start." You care about:

1. **Environment isolation** — Dev uses 128Mi of RAM. Production uses 512Mi. Same code, different resource profiles.
2. **Autoscaling** — The backend should scale horizontally under load, with guardrails set by the platform team.
3. **Deployment pipeline** — Changes flow from development to staging to production, with promotion gates.
4. **Immutable releases** — What passes staging is exactly what deploys to production. No rebuilds, no drift.
5. **Dependency management** — Services discover each other without hardcoded URLs.
6. **Scheduled workloads** — The streak engine runs daily, has access to the database, and uses appropriate resource limits.

On raw Kubernetes, achieving all six requires deep expertise across multiple resource types and at least 20 YAML files. With OpenChoreo, the platform engineer sets up the golden paths once, and every developer gets all six for free.

## How OpenChoreo Makes It Work

### Golden Path Templates

The platform engineer defines `ClusterComponentType` resources — templates that encode best practices:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: deployment/api-service
spec:
  workloadType: deployment
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        port:
          type: integer
          default: 8080
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        replicas:
          type: integer
          default: 1
          minimum: 1
          maximum: 20
        resources:
          type: object
          properties:
            requests:
              type: object
              properties:
                cpu:
                  type: string
                  default: "50m"
                memory:
                  type: string
                  default: "128Mi"
  traits:
    - name: horizontal-pod-autoscaler
      kind: ClusterTrait
      instanceName: hpa
      parameters:
        targetCPUUtilizationPercentage: 75
```

This template says:

- **API services are Deployments** with a configurable port (default 8080).
- **Replicas are bounded** between 1 and 20 — a developer can't accidentally set replicas to 100.
- **Resource defaults** are sensible (50m CPU, 128Mi memory) but overridable per environment.
- **Every API service gets an HPA** with a 75% CPU target. The platform engineer locks the CPU target; the developer controls replica bounds.
- **Schema validation is enforced** — invalid values are rejected by the control plane before anything hits the cluster.

The developer doesn't need to know about HPAs, resource requests, or Kubernetes scheduling. They pick a component type and fill in their values.

### The Developer's View

Here's what the developer writes to deploy Habitual's backend:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: habitual-api
spec:
  owner:
    projectName: habitual
  componentType:
    kind: ClusterComponentType
    name: deployment/api-service
  autoDeploy: true
  parameters:
    port: 8080
```

And the workload definition:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: habitual-api
spec:
  owner:
    projectName: habitual
    componentName: habitual-api
  container:
    image: ghcr.io/openchoreo/demo/habitual-backend:latest
    env:
      - key: PORT
        value: "8080"
  endpoints:
    http:
      type: HTTP
      port: 8080
      visibility:
        - project
  dependencies:
    endpoints:
      - project: habitual
        component: habitual-db
        name: tcp
        visibility: project
        envBindings:
          host: DB_HOST
          port: DB_PORT
```

The developer describes *what* they want: a service running on port 8080 with a project-scoped endpoint, depending on the database's TCP endpoint. OpenChoreo handles *how*: creating the Deployment, Service, HPA, NetworkPolicy, and injecting the database connection details as environment variables.

### Environment-Specific Overrides

The same backend runs differently across environments:

```yaml
# Development
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: habitual-api-development
spec:
  owner:
    projectName: habitual
    componentName: habitual-api
  environment: development
  componentTypeEnvironmentConfigs:
    replicas: 1
    resources:
      requests:
        cpu: "50m"
        memory: "128Mi"
```

```yaml
# Production
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: habitual-api-production
spec:
  owner:
    projectName: habitual
    componentName: habitual-api
  environment: production
  componentTypeEnvironmentConfigs:
    replicas: 3
    resources:
      requests:
        cpu: "200m"
        memory: "512Mi"
  traitEnvironmentConfigs:
    hpa:
      minReplicas: 3
      maxReplicas: 10
```

In development: 1 replica, 128Mi, no autoscaling.
In production: 3 replicas, 512Mi, autoscaling between 3 and 10 pods at 75% CPU.

This is the same component, the same image, the same code — just different operational profiles. No Kustomize overlays, no Helm value files, no environment-specific branches. Just declarative overrides on the release binding.

### Scheduled Workloads

The streak engine is a cronjob:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: streak-engine
spec:
  owner:
    projectName: habitual
  componentType:
    kind: ClusterComponentType
    name: cronjob/scheduled-task
  autoDeploy: true
  parameters:
    schedule: "5 0 * * *"
```

The `cronjob/scheduled-task` component type handles all the Kubernetes CronJob boilerplate — restart policies, concurrency policies, deadline seconds, resource limits. The developer just specifies the cron schedule.

The streak engine's workload declares the same dependency pattern as the backend:

```yaml
dependencies:
  endpoints:
    - project: habitual
      component: habitual-db
      name: tcp
      visibility: project
      envBindings:
        host: DB_HOST
        port: DB_PORT
```

The database connection details are injected identically for both the long-running API server and the ephemeral cronjob. No duplicated ConfigMaps, no shared Secrets that become a single point of failure.

### The Promotion Pipeline

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeploymentPipeline
metadata:
  name: default
spec:
  promotionPaths:
    - sourceEnvironmentRef:
        name: development
      targetEnvironmentRefs:
        - name: staging
    - sourceEnvironmentRef:
        name: staging
      targetEnvironmentRefs:
        - name: production
```

When `autoDeploy: true` is set, OpenChoreo creates an immutable `ComponentRelease` — a frozen snapshot of the component type spec, trait configurations, workload template, and all parameters. This snapshot is what gets promoted through the pipeline.

The key insight is *immutability*. The ComponentRelease is validated with Kubernetes CEL rules (`self == oldSelf`) — once created, it cannot be modified. What you test in staging is byte-for-byte identical to what runs in production. No configuration drift. No "oh, someone changed the staging config after we tested."

## The Streak Engine: A Real Background Job

The streak engine runs daily at 00:05 UTC and does real work:

1. **For each active habit**: Counts consecutive completion days backwards from yesterday. If you completed a habit for the last 14 days straight, your current streak is 14. If you missed yesterday, it's 0.

2. **Updates longest streak**: If the current streak exceeds the stored longest streak, update it. This is a high-water mark that persists across streak breaks.

3. **Computes 30-day completion rate**: `completions_in_last_30_days / 30 * 100`. A simple percentage that tells you how consistent you've been.

4. **Computes weekly aggregates**: For each profile, counts total completions and total possible completions (habits * 7) for the current week.

All results are upserted into dedicated `streaks` and `weekly_stats` tables using `ON CONFLICT ... DO UPDATE` to ensure idempotency. The API server reads from these tables directly — no computation on the request path.

This pattern (precompute in a cronjob, serve from a table) is exactly the kind of architecture that OpenChoreo is designed to support. The streak engine is a separate component with its own workload type, resource limits, and schedule — but it shares dependencies with the API server through the same declarative mechanism.

## Try It Yourself

### Local Development

```bash
cd demo/habitual
make dev
open http://localhost:3000
```

You'll see a habit tracker with 8 pre-seeded habits (Exercise, Read 30min, Drink 2L Water, Meditate, No Social Media, Journal, Eat Healthy, Walk 10k Steps) and 180 days of completion data. Check off habits, explore the heatmap, compare habits side-by-side, view per-habit detail pages, time your focus sessions, and check your consistency grade.

### Deploy to OpenChoreo

```bash
# Apply shared platform resources
kubectl apply -f shared/ocResources/

# Apply Habitual resources
kubectl apply -f habitual/ocResources/
```

The control plane creates all four workloads, wires dependencies, sets up the daily cronjob, configures autoscaling for the backend, and deploys to the development environment.

## The Takeaway

Production readiness isn't a binary state — it's a spectrum of operational capabilities that most teams accumulate slowly over months or years. Environment isolation. Autoscaling. Immutable deployments. Promotion pipelines. Secret management. Network policies.

OpenChoreo encodes all of these into the platform layer. The platform engineer defines the golden paths once. Every developer who deploys a component gets the full production stack for free — not because they configured it, but because the component type includes it by default.

Habitual is a simple app. But it deploys like a serious one.

**GitHub**: [github.com/openchoreo/openchoreo](https://github.com/openchoreo/openchoreo)
