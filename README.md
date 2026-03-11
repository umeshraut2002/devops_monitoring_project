## Cloud Infrastructure Monitoring System

A DevOps-focused cloud project designed to practice **Docker containerization**, **CI/CD pipelines**, **cloud deployment on AWS EC2**, **infrastructure architecture**, and **monitoring systems** using Prometheus and Grafana.

### 1. System Overview

This project implements a small but realistic microservices-based monitoring platform:

- **metrics-agent**: Python service that collects host metrics (CPU, RAM, disk usage) and exposes them as Prometheus metrics.
- **api-service**: Node.js/Express API connected to MongoDB, exports business-level metrics via `/metrics`.
- **MongoDB**: Stores application data for the API service.
- **Prometheus**: Scrapes metrics from `metrics-agent`, `api-service`, and `node-exporter`.
- **Grafana**: Dashboards and visualizations using Prometheus as a data source.
- **node-exporter**: Exposes OS-level metrics from the EC2 host.
- **Nginx** (prod): Reverse proxy for the API and Grafana in production on EC2.

You can:

- Build and run containers locally.
- Practice multi-container networking with Docker Compose.
- Push images to Docker Hub via GitHub Actions.
- Deploy and update the stack on an AWS EC2 instance via SSH.
- Explore metrics and dashboards in Prometheus/Grafana.

---

### 2. Architecture Diagram

High-level logical architecture:

```mermaid
flowchart LR
    subgraph Client
      Browser -->|HTTP| Nginx
    end

    subgraph AWS_EC2 [AWS EC2 Instance]
      Nginx --> API[api-service (Node.js)]
      Nginx --> GRAF[Grafana UI]

      API --> Mongo[(MongoDB)]

      subgraph Monitoring
        MET[metrics-agent]
        NE[node-exporter]
        PROM[Prometheus]
        PROM -->|Data source| GRAF
      end

      PROM <-->|Scrape metrics| MET
      PROM <-->|Scrape metrics| API
      PROM <-->|Scrape metrics| NE
    end
```

Local `docker-compose.yml` runs all services on a single Docker network `monitoring_net`.  
Production `docker-compose.prod.yml` runs the same stack on EC2, fronted by Nginx.

---

### 3. Project Structure

Key directories:

- **`metrics-agent/`**
  - `app.py` – collects CPU, memory, disk usage via `psutil` and exposes Prometheus metrics on `/metrics`.
  - `Dockerfile`
  - `requirements.txt`
- **`api-service/`**
  - `src/server.js` – Express API with `/health`, `/api/status`, and `/metrics` endpoints.
  - `Dockerfile`
  - `package.json`
- **`monitoring/`**
  - `prometheus/prometheus.yml` – scrape config for Prometheus.
  - `grafana/provisioning/datasources/datasource.yml` – auto-configures Prometheus as Grafana data source.
- **`deploy/`**
  - `nginx/nginx.conf` – Nginx reverse proxy for API and Grafana.
  - `ec2-setup.md` – EC2 bootstrap guide.
  - `env.example` – example env vars for production.
- **`.github/workflows/cicd.yml`**
  - GitHub Actions pipeline for build, push, deploy.
- **`docker-compose.yml`**
  - Local development stack (all services).
- **`docker-compose.prod.yml`**
  - Production stack for EC2.

---

### 4. Docker & Local Development

#### 4.1 Prerequisites

- Docker Engine 20+ and Docker Compose v2.

#### 4.2 Build and Run Locally

- **Build all images and start services:**

```bash
docker compose up -d --build
```

- **Check running containers:**

```bash
docker ps
```

- **Key local endpoints:**

- **API service**
  - `http://localhost:3000/health`
  - `http://localhost:3000/api/status`
  - `http://localhost:3000/metrics`
- **metrics-agent**
  - `http://localhost:9100/metrics`
- **Prometheus**
  - `http://localhost:9090`
- **Grafana**
  - `http://localhost:3001` (user: `admin`, password: `admin` by default)

#### 4.3 Stopping and Cleaning

```bash
docker compose down
docker compose down -v   # also remove named volumes (Mongo data, etc.)
```

---

### 5. CI/CD with GitHub Actions

The workflow `.github/workflows/cicd.yml` implements a simple **build → push → deploy** pipeline.

#### 5.1 Triggers

- **Trigger**: `push` to the `main` branch.

#### 5.2 Pipeline Stages

- **build-and-push job**
  - Checks out the repository.
  - Logs in to Docker Hub using:
    - `DOCKERHUB_USERNAME`
    - `DOCKERHUB_TOKEN`
  - Builds and pushes:
    - `cloud-infra-monitoring-api` (Node.js API image).
    - `cloud-infra-metrics-agent` (Python metrics agent image).
  - Tags images with:
    - `latest`
    - The current commit SHA (`${{ github.sha }}`).

- **deploy-to-ec2 job**
  - Depends on `build-and-push`.
  - Only runs on branch `main`.
  - Generates a `.env` file for production using GitHub secrets:
    - `DOCKERHUB_USERNAME`
    - `MONGO_URI`
    - `GF_ADMIN_USER`
    - `GF_ADMIN_PASSWORD`
  - Copies `.env`, `docker-compose.prod.yml`, `monitoring/`, and `deploy/` to the EC2 instance via `scp`.
  - SSHs into EC2 and runs:

```bash
docker compose -f docker-compose.prod.yml pull || true
docker compose -f docker-compose.prod.yml up -d
```

This ensures the EC2 stack is updated to the latest images and configuration on every push to `main`.

#### 5.3 Required GitHub Secrets

Configure these in your GitHub repository **Settings → Secrets and variables → Actions**:

- **DockerHub**
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN` (personal access token or password)
- **EC2**
  - `EC2_HOST` – EC2 public IP or DNS.
  - `EC2_USER` – e.g., `ec2-user` or `ubuntu`.
  - `EC2_SSH_KEY` – private SSH key for the EC2 instance.
- **Application**
  - `MONGO_URI` – e.g., `mongodb://mongo:27017/cloud_monitoring`.
  - `GF_ADMIN_USER` – Grafana admin username.
  - `GF_ADMIN_PASSWORD` – Grafana admin password.

---

### 6. AWS EC2 Deployment

#### 6.1 EC2 Preparation

Follow `deploy/ec2-setup.md` for step-by-step EC2 setup:

- Launch an EC2 instance (Amazon Linux 2 or Ubuntu).
- Open ports:
  - 22 (SSH)
  - 80 (HTTP)
- Install:
  - Docker
  - Docker Compose v2 plugin
- Create app directory:

```bash
mkdir -p ~/cloud-infra-monitoring
```

#### 6.2 Production Stack

The production stack is defined in `docker-compose.prod.yml`:

- **Services**
  - `mongo` – MongoDB database.
  - `api-service` – Node.js API (pulled from Docker Hub).
  - `metrics-agent` – Python metrics agent (pulled from Docker Hub).
  - `prometheus` – metrics scraper.
  - `grafana` – dashboards, reading from Prometheus.
  - `node-exporter` – host metrics exporter.
  - `nginx` – reverse proxy exposing API and Grafana on port 80.

- **Key environment variables** (passed via `.env`):
  - `DOCKERHUB_USERNAME`
  - `IMAGE_TAG`
  - `MONGO_URI`
  - `GF_ADMIN_USER`
  - `GF_ADMIN_PASSWORD`

#### 6.3 Accessing the Deployed System

Once deployed:

- **Health check:**
  - `http://<EC2_PUBLIC_IP>/health` → API health endpoint via Nginx.
- **API status:**
  - `http://<EC2_PUBLIC_IP>/api/status`
- **Grafana UI:**
  - `http://<EC2_PUBLIC_IP>/grafana/`
- **Prometheus UI (if opened directly):**
  - `http://<EC2_PUBLIC_IP>:9090`

---

### 7. Monitoring Stack Details

#### 7.1 Prometheus Configuration

`monitoring/prometheus/prometheus.yml` configures scrape jobs:

- **`prometheus`** – self-scrape.
- **`metrics-agent`** – Python metrics agent container:
  - Target: `metrics-agent:9100`
- **`api-service`** – Node.js API:
  - Target: `api-service:3000`
  - Path: `/metrics`
- **`node-exporter`** – host-level metrics:
  - Target: `node-exporter:9100`

You can add more jobs or targets to practice Prometheus configuration.

#### 7.2 Grafana Provisioning

`monitoring/grafana/provisioning/datasources/datasource.yml`:

- Automatically creates a **Prometheus** data source pointing at `http://prometheus:9090`.
- Once Grafana is up, you can:
  - Log in (`admin` / `admin` by default, or use your own credentials in production).
  - Import built-in dashboards for Node Exporter and Prometheus.
  - Create custom dashboards for `metrics-agent` and `api-service` metrics.

---

### 8. DevOps Practice Scenarios

You can use this project to practice:

- **Docker containerization**
  - Write and optimize Dockerfiles for Node.js and Python services.
  - Build and run multi-container stacks with `docker compose`.
- **Container networking**
  - Explore how services discover each other via Docker network and service names.
  - Add new services and configure Prometheus to scrape them.
- **CI/CD pipelines with GitHub Actions**
  - Trigger builds on push.
  - Publish images to Docker Hub.
  - Automate deployments to EC2 using SSH and `docker compose`.
- **Cloud deployment on AWS**
  - Configure EC2 security groups, IAM, and basic hardening.
  - Practice blue/green or rolling-style updates by changing image tags.
- **Monitoring infrastructure**
  - Use Prometheus to scrape app and infrastructure metrics.
  - Build Grafana dashboards and alerts (you can extend this project to include alerting).

---

### 9. Quick Command Reference

- **Local stack up (dev):**

```bash
docker compose up -d --build
```

- **Local stack down:**

```bash
docker compose down
```

- **Prod stack up on EC2 (manual):**

```bash
docker compose -f docker-compose.prod.yml up -d
```

- **View Prometheus targets (local or EC2):**

```bash
open http://localhost:9090/targets   # or use your browser / EC2 IP
```

---

### 10. Next Steps / Extensions

Ideas to extend the project for more advanced practice:

- Add **Alertmanager** with basic alert rules.
- Store API logs in **ELK stack** (Elasticsearch, Logstash, Kibana) or **Loki**.
- Add **Kubernetes** manifests and migrate from Docker Compose to K8s.
- Integrate **Terraform** to provision the EC2 instance and security groups.

This project is intentionally simple but production-flavored to maximize hands-on DevOps learning.

