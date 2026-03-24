# OpenChoreo OC Resources

## Directory Structure

```
ocResources/
├── platform/                          # Platform Engineer resources
│   ├── component-types/
│   │   ├── database.yaml              # TCP database (custom)
│   │   ├── service.yaml               # HTTP services
│   │   └── web-application.yaml       # Web frontends
│   └── traits/
│       └── persistent-volume.yaml     # Persistent storage
└── projects/
    └── habitual/
        ├── project.yaml
        └── components/
            ├── backend/               # Go REST API
            │   ├── component.yaml
            │   └── workload.yaml
            ├── frontend/              # React SPA
            │   ├── component.yaml
            │   └── workload.yaml
            ├── postgres/              # PostgreSQL 16
            │   ├── component.yaml
            │   └── workload.yaml
            └── cronjob/               # Nightly streak computation
                ├── component.yaml
                └── workload.yaml
```

## Component Types

### Namespace-scoped (custom, under `platform/component-types/`)

| Name | Workload Type | Use Case |
|------|--------------|----------|
| `deployment/service` | Deployment | HTTP/gRPC services with endpoints and HTTPRoute |
| `deployment/web-application` | Deployment | Web frontends with external HTTPRoute |
| `deployment/database` | Deployment | TCP-only service with persistent-volume trait |

### Cluster-scoped (built-in, no yaml needed)

| Name | Workload Type | Use Case |
|------|--------------|----------|
| `cronjob/scheduled-task` | CronJob | Periodic scheduled jobs |

The `database` ComponentType differs from `service` by:
- Exposes a **TCP port** (not HTTP) via ClusterIP Service
- No HTTPRoute generation
- Allows the `persistent-volume` trait for durable storage

## Traits

### `persistent-volume` (namespace-scoped)

Attaches persistent storage to a component. Creates a PVC and patches the Deployment with volume/volumeMount.

- Default size: `1Gi`
- Default storageClass: `local-path`

## Apply Order

Platform resources must exist before components reference them:

```bash
# 1. Platform resources
kubectl apply -f ocResources/platform/traits/persistent-volume.yaml
kubectl apply -f ocResources/platform/component-types/

# 2. Project
kubectl apply -f ocResources/projects/habitual/project.yaml

# 3. Components (each directory)
kubectl apply -f ocResources/projects/habitual/components/postgres/
kubectl apply -f ocResources/projects/habitual/components/backend/
kubectl apply -f ocResources/projects/habitual/components/frontend/
kubectl apply -f ocResources/projects/habitual/components/cronjob/
```
