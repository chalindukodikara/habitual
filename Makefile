DOCKER_NAMESPACE ?= chalindukodikara
TAG              ?= latest

FRONTEND_IMAGE   = $(DOCKER_NAMESPACE)/habitual-frontend:$(TAG)
BACKEND_IMAGE    = $(DOCKER_NAMESPACE)/habitual-backend:$(TAG)
CRONJOB_IMAGE    = $(DOCKER_NAMESPACE)/habitual-cronjob:$(TAG)

.PHONY: help dev build build-frontend build-backend build-cronjob \
        push push-frontend push-backend push-cronjob \
        test-backend lint-backend lint-frontend seed run-cronjob down clean

help:             ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

dev:              ## Start all services with docker-compose
	docker compose up --build

build: build-frontend build-backend build-cronjob ## Build all Docker images

build-frontend:   ## Build frontend Docker image
	docker build -t $(FRONTEND_IMAGE) ./frontend

build-backend:    ## Build backend Docker image
	docker build -t $(BACKEND_IMAGE) ./backend

build-cronjob:    ## Build cronjob Docker image
	docker build -t $(CRONJOB_IMAGE) ./cronjob

push: push-frontend push-backend push-cronjob ## Push all Docker images

push-frontend:    ## Push frontend image
	docker push $(FRONTEND_IMAGE)

push-backend:     ## Push backend image
	docker push $(BACKEND_IMAGE)

push-cronjob:     ## Push cronjob image
	docker push $(CRONJOB_IMAGE)

test-backend:     ## Run backend Go tests
	cd backend && go test ./...

lint-backend:     ## Run Go vet on backend
	cd backend && go vet ./...

lint-frontend:    ## Run TypeScript type check
	cd frontend && npm run lint

seed:             ## Reset and seed the database
	docker compose exec postgres psql -U appuser -d habitualdb -f /docker-entrypoint-initdb.d/01-init.sql
	docker compose exec postgres psql -U appuser -d habitualdb -f /docker-entrypoint-initdb.d/02-seed.sql

run-cronjob:      ## Run the streak engine cronjob manually
	docker compose run --rm cronjob

down:             ## Stop all services
	docker compose down

clean:            ## Stop and remove all containers + volumes
	docker compose down -v
