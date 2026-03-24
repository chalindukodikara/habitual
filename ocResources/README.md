# OpenChoreo OC Resources

## Directory Structure

```
ocResources/
├── platform/                          # Platform Engineer resources
│   ├── component-types/
│   │   └── database.yaml              # ClusterComponentType: TCP database
│   └── traits/
│       └── persistent-volume.yaml     # ClusterTrait: persistent storage
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

## ClusterComponentTypes

### Built-in (no yaml needed)

| Name | Workload Type | Use Case |
|------|--------------|----------|
| `deployment/service` | Deployment | HTTP/gRPC services with endpoints and HTTPRoute |
| `deployment/web-application` | Deployment | Web frontends with external HTTPRoute |
| `cronjob/scheduled-task` | CronJob | Periodic scheduled jobs |

### Custom (under `platform/component-types/`)

| Name | Workload Type | Use Case |
|------|--------------|----------|
| `deployment/database` | Deployment | TCP-only service with persistent-volume trait |

The `database` ClusterComponentType differs from `service` by:
- Exposes a **TCP port** (not HTTP) via ClusterIP Service
- No HTTPRoute generation
- Allows the `persistent-volume` ClusterTrait for durable storage

## ClusterTraits

### Custom (under `platform/traits/`)

### `persistent-volume`

Attaches persistent storage to a component. Creates a PVC and patches the Deployment with volume/volumeMount.

- Default size: `1Gi`
- Default storageClass: `local-path`

## Apply Order

Platform resources must exist before components reference them:

```bash
# 1. Platform resources (cluster-scoped)
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
