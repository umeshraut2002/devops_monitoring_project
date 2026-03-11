Below is a **simpler step-by-step workflow**. Follow each step in order. Don’t move to the next step until the current one works. This mirrors a typical DevOps flow from **local → containers → repository → CI/CD → cloud → monitoring**.

Tools involved:

* Docker
* GitHub
* GitHub Actions
* Amazon Web Services
* Amazon EC2
* Prometheus
* Grafana
* Nginx

---

# Step 1 — Check Your Project Folder

Your project should look like this:

```
cloud-monitoring-system
│
├── api-service
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
│
├── metrics-agent
│   ├── Dockerfile
│   └── agent.js
│
├── prometheus
│   └── prometheus.yml
│
├── docker-compose.yml
```

If this structure exists, continue.

---

# Step 2 — Run Project with Docker (Local)

Inside the project folder run:

```bash
docker compose up --build
```

Check containers:

```bash
docker ps
```

You should see containers like:

```
api
metrics-agent
mongo
prometheus
grafana
```

Test in browser:

```
http://localhost:3000
http://localhost:9090
http://localhost:3001
```

If this works → Docker setup is correct.

---

# Step 3 — Push Project to Git Repository

Initialize repository.

```bash
git init
git add .
git commit -m "initial devops monitoring project"
```

Create a repository on **GitHub**.

Then connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cloud-monitoring-system.git
git branch -M main
git push -u origin main
```

Now your project is stored in GitHub.

---

# Step 4 — Create DockerHub Repository

Create account on DockerHub.

Login from terminal:

```bash
docker login
```

Build image:

```bash
docker build -t username/api-service ./api-service
```

Push image:

```bash
docker push username/api-service
```

This stores your image in the Docker registry.

---

# Step 5 — Create CI/CD Pipeline

Inside your project create this folder:

```
.github/workflows
```

Create file:

```
ci-cd.yml
```

Basic pipeline:

```yaml
name: CI-CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - name: Build Docker Image
        run: docker build -t username/api-service ./api-service
```

Push code again:

```bash
git add .
git commit -m "added pipeline"
git push
```

Now check **GitHub Actions** tab → pipeline will run automatically.

---

# Step 6 — Launch Cloud Server

Login to **Amazon Web Services**.

Create instance in **Amazon EC2**:

Settings:

```
Ubuntu 22
t2.micro
20GB storage
```

Open ports:

```
22
80
3000
9090
3001
```

---

# Step 7 — Connect to Server

From terminal:

```bash
ssh -i key.pem ubuntu@EC2_PUBLIC_IP
```

You are now inside your cloud server.

---

# Step 8 — Install Docker on Server

Run:

```bash
sudo apt update
sudo apt install docker.io -y
```

Start Docker:

```bash
sudo systemctl start docker
```

Check:

```bash
docker --version
```

---

# Step 9 — Run Container on EC2

Pull image:

```bash
docker pull username/api-service
```

Run container:

```bash
docker run -d -p 3000:3000 username/api-service
```

Test:

```
http://EC2-IP:3000
```

Your API is now running in the cloud.

---

# Step 10 — Setup Reverse Proxy

Install **Nginx**.

```bash
sudo apt install nginx
```

Edit configuration:

```bash
sudo nano /etc/nginx/sites-available/default
```

Add:

```
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Restart nginx:

```bash
sudo systemctl restart nginx
```

Now access:

```
http://EC2-IP
```

---

# Step 11 — Start Monitoring Stack

Run **Prometheus**:

```bash
docker run -d -p 9090:9090 prom/prometheus
```

Run **Grafana**:

```bash
docker run -d -p 3001:3000 grafana/grafana
```

Open dashboard:

```
http://EC2-IP:3001
```

Login:

```
admin
admin
```

Add Prometheus as data source.

---

# Step 12 — Final Workflow (Very Important)

Your DevOps workflow now looks like this:

```
Code Change
   ↓
Git Push
   ↓
GitHub Actions CI/CD
   ↓
Docker Image Build
   ↓
Push to Registry
   ↓
Deploy to EC2
   ↓
Containers Running
   ↓
Monitoring with Grafana
```

---
