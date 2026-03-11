Cloud Infrastructure Monitoring System - Project Structure
==========================================================

High-level directories and components for the project.

Root
----
- `metrics-agent/` - Lightweight agent that collects system metrics (CPU, RAM, disk) and exposes them as Prometheus metrics.
- `api-service/` - Node.js Express API exposing application endpoints and a `/metrics` endpoint for Prometheus scraping.
- `deploy/` - Production deployment configuration and scripts for AWS EC2.
- `monitoring/` - Prometheus and Grafana configuration.
- `.github/workflows/` - CI/CD pipelines (GitHub Actions).
- `docker-compose.yml` - Local development multi-container stack.
- `docker-compose.prod.yml` - Production stack for EC2.

metrics-agent
-------------
- `Dockerfile`
- `requirements.txt`
- `app.py` - Collects host/container metrics via `psutil` and exposes them via `/metrics` using `prometheus_client`.

api-service
-----------
- `Dockerfile`
- `package.json`
- `src/server.js` - Express server with:
  - Health endpoint (`/health`)
  - Sample API endpoint (`/api/status`)
  - Prometheus metrics endpoint (`/metrics`) using `prom-client`.

monitoring
----------
- `prometheus/prometheus.yml` - Scrape configs for:
  - `metrics-agent`
  - `api-service`
  - `node-exporter`
- `grafana/` - Provisioning and data source configuration.

deploy
------
- `nginx/nginx.conf` - Reverse proxy for API service and Grafana.
- `ec2-setup.md` - Steps to bootstrap an EC2 instance (Docker, docker-compose plugin, firewall rules).
- `env.example` - Example environment variables for production.

.github/workflows
-----------------
- `cicd.yml` - GitHub Actions workflow:
  - Trigger: push to `main`
  - Jobs:
    - Build & test
    - Build & push Docker images to Docker Hub
    - Deploy to EC2 over SSH (`docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`).

Networking
----------
- Single Docker network `monitoring_net` for all services.
- Nginx reverse proxy exposes ports 80/443.

