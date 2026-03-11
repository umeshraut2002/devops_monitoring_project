# EC2 Setup Guide

This document describes how to prepare an AWS EC2 instance to host the **Cloud Infrastructure Monitoring System** stack using Docker and `docker compose`.

## 1. Launch EC2 Instance

- **AMI**: Amazon Linux 2 or Ubuntu LTS
- **Instance type**: t3.small or larger (for practicing, t3.micro is ok)
- **Security group**:
  - Inbound:
    - TCP 22 (SSH) from your IP
    - TCP 80 (HTTP) from 0.0.0.0/0
  - Outbound: allow all

## 2. Install Docker and Docker Compose Plugin

On Amazon Linux 2:

```bash
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Docker Compose plugin (v2)
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
  -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"

docker compose version
```

Log out and back in to apply the `docker` group change.

## 3. Create Application Directory

```bash
mkdir -p ~/cloud-infra-monitoring
cd ~/cloud-infra-monitoring
```

The GitHub Actions workflow will copy:

- `.env`
- `docker-compose.prod.yml`
- `monitoring/`
- `deploy/`

into this directory on each deployment.

## 4. First Manual Deployment (Optional)

If you want to deploy manually before wiring CI/CD:

```bash
docker login
# pull images previously pushed
docker pull your-dockerhub-username/cloud-infra-monitoring-api:latest
docker pull your-dockerhub-username/cloud-infra-metrics-agent:latest

# copy project files manually (scp) or clone repo
docker compose -f docker-compose.prod.yml up -d
```

## 5. Validate Deployment

Once the stack is running:

- `curl http://<EC2_PUBLIC_IP>/health` → API health endpoint via Nginx
- `curl http://<EC2_PUBLIC_IP>/api/status` → API status
- Open `http://<EC2_PUBLIC_IP>/grafana/` in browser (Grafana UI)
- Open Prometheus directly if needed: `http://<EC2_PUBLIC_IP>:9090`

