# NDISuite Report Generator Deployment Guide

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Manual Deployment](#manual-deployment)
7. [Database Setup](#database-setup)
8. [SSL Configuration](#ssl-configuration)
9. [Monitoring Setup](#monitoring-setup)
10. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
11. [Troubleshooting](#troubleshooting)

## Deployment Options

The NDISuite Report Generator can be deployed using several methods:

1. **Docker Compose**: Ideal for small-scale deployments or development environments
2. **Kubernetes**: Recommended for production environments requiring scalability
3. **Manual Deployment**: For custom infrastructure configurations

## Prerequisites

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ (16GB+ recommended for production)
- **Storage**: 20GB+ for application, database, and file storage
- **Network**: Public internet access, static IP or domain name

### Software Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+
- Kubernetes 1.20+ (for Kubernetes deployment)
- PostgreSQL 13+
- Redis 6+
- MongoDB 5+ (optional, for vector storage)
- Node.js 18+ (for manual frontend deployment)
- Python 3.10+ (for manual backend deployment)

## Environment Configuration

### Required Environment Variables

Create a `.env` file based on the `.env.example` template with these critical variables:

```
# Django Settings
DEBUG=False
SECRET_KEY=your-secure-secret-key
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# Database Configuration
POSTGRES_DB=ndisuite
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# MongoDB Configuration (optional)
MONGODB_URI=mongodb://mongodb:27017/
MONGODB_DB=ndisuite

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379


TRANSCRIPTION_MODEL=whisper-1
GENERATION_MODEL=gpt-4-turbo
EMBEDDING_MODEL=text-embedding-3-large
REFINING_MODEL=gpt-4-turbo

# Vector Store Configuration
VECTOR_STORE_TYPE=chroma
VECTOR_STORE_PATH=/app/vector_db
```

**IMPORTANT NOTES:**
1. The OpenAI API key format shown above requires:
   - OpenAI library version 1.66.0+
   - HTTPX 0.27.0+
2. Always use a secure, random value for `SECRET_KEY`
3. Set `DEBUG=False` in production environments
4. Update `ALLOWED_HOSTS` with your domain(s)

## Docker Deployment

### Using Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ndisuite-report-generator-app.git
   cd ndisuite-report-generator-app
   ```

2. Create and configure the environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   ```

3. Build and start the containers:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. Create a superuser (admin):
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

5. Access the application:
   - Frontend: http://yourdomain.com
   - Backend API: http://api.yourdomain.com
   - Admin: http://api.yourdomain.com/admin/

### Docker Compose Services

The `docker-compose.yml` file includes the following services:

- **db**: PostgreSQL database
- **redis**: Redis for caching and message broker
- **backend**: Django backend API
- **celery**: Background task worker
- **celery-beat**: Scheduled task scheduler
- **frontend**: Next.js frontend application

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-managed)
- kubectl configured to access your cluster
- Helm 3+ (optional but recommended)

### Deployment Steps

1. Create the namespace:
   ```bash
   kubectl apply -f kubernetes/production/namespace.yaml
   ```

2. Create ConfigMap and Secrets:
   ```bash
   # Update secrets.yaml with your environment-specific values first
   kubectl apply -f kubernetes/production/configmap.yaml
   kubectl apply -f kubernetes/production/secrets.yaml
   ```

3. Deploy database and Redis (skip if using managed services):
   ```bash
   kubectl apply -f kubernetes/production/postgres.yaml
   kubectl apply -f kubernetes/production/redis.yaml
   ```

4. Deploy backend services:
   ```bash
   kubectl apply -f kubernetes/production/backend-deployment.yaml
   ```

5. Deploy frontend:
   ```bash
   kubectl apply -f kubernetes/production/frontend-deployment.yaml
   ```

6. Create services and ingress:
   ```bash
   kubectl apply -f kubernetes/production/service.yaml
   kubectl apply -f kubernetes/production/ingress.yaml
   ```

7. Verify deployment:
   ```bash
   kubectl get pods -n ndisuite-production
   ```

## Manual Deployment

### Backend Deployment

1. Set up a Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Configure environment variables by creating a `.env` file

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Collect static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

5. Use Gunicorn with Nginx:
   ```bash
   gunicorn ndisuite.wsgi:application --bind 0.0.0.0:8000 --workers 3
   ```

### Frontend Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a production build:
   ```bash
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

4. Alternatively, export a static build:
   ```bash
   npm run export
   ```

### Setting up Nginx

Example Nginx configuration for the backend:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Example Nginx configuration for the frontend:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Database Setup

### PostgreSQL Setup

1. Install PostgreSQL:
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

2. Create a database and user:
   ```bash
   sudo -u postgres psql
   postgres=# CREATE DATABASE ndisuite;
   postgres=# CREATE USER ndisuite_user WITH PASSWORD 'secure-password';
   postgres=# GRANT ALL PRIVILEGES ON DATABASE ndisuite TO ndisuite_user;
   postgres=# \q
   ```

3. Update `.env` with database credentials

### MongoDB Setup (Optional)

1. Install MongoDB:
   ```bash
   # Follow MongoDB installation instructions for your OS
   ```

2. Create a database:
   ```bash
   mongo
   > use ndisuite
   > db.createUser({user: "ndisuite_user", pwd: "secure-password", roles: [{role: "readWrite", db: "ndisuite"}]})
   > exit
   ```

3. Update `.env` with MongoDB URI

## SSL Configuration

### Using Let's Encrypt with Certbot

1. Install Certbot:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. Obtain SSL certificates:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

3. Configure automatic renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

### Using SSL with Kubernetes

If using Kubernetes, configure cert-manager:

1. Install cert-manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.9.1/cert-manager.yaml
   ```

2. Create ClusterIssuer:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   ```

## Monitoring Setup

### Setting up Application Monitoring

1. Configure Sentry for error tracking:
   ```bash
   # Add to your .env file:
   SENTRY_DSN=your-sentry-dsn
   ```

2. Set up Prometheus and Grafana for metrics monitoring:
   - Deploy Prometheus Operator if using Kubernetes
   - Configure custom metrics export from the application

3. Set up logging with ELK stack or similar:
   - Configure Filebeat for log shipping
   - Set up Elasticsearch for log storage
   - Configure Kibana for log visualization

## Backup and Disaster Recovery

### Database Backup

1. Automated PostgreSQL backups:
   ```bash
   pg_dump -U postgres -d ndisuite > backup_$(date +%Y%m%d).sql
   ```

2. Schedule backups with cron:
   ```
   0 2 * * * pg_dump -U postgres -d ndisuite > /path/to/backups/backup_$(date +%Y%m%d).sql
   ```

3. Rotate backups to prevent excessive storage usage

### Application Backup

1. Backup uploaded files:
   ```bash
   rsync -av /path/to/media /path/to/backup/
   ```

2. Backup vector database (if applicable):
   ```bash
   rsync -av /path/to/vector_db /path/to/backup/
   ```

### Disaster Recovery Plan

1. Maintain database backups in multiple locations
2. Document recovery procedures for different failure scenarios
3. Periodically test restoration procedures
4. Configure monitoring alerts for early detection of issues

## Troubleshooting

### Common Deployment Issues

#### WebSocket Connection Failures

**Symptoms**: Real-time transcription not working, WebSocket connection errors in browser console

**Solutions**:
- Ensure Nginx is configured to proxy WebSocket connections
- Check CORS settings
- Verify that the WebSocket endpoint URLs are correct

#### Database Connection Issues

**Symptoms**: "Could not connect to database" errors

**Solutions**:
- Check database credentials in .env
- Verify database service is running
- Check network access between application and database

#### API Key Issues

**Symptoms**: OpenAI API errors, 401 Unauthorized responses

**Solutions**:
- Verify API key is correctly formatted and valid
- Ensure OpenAI library is version 1.66.0+ and HTTPX is 0.27.0+
- Check for any billing or quota issues with the OpenAI account

#### Performance Issues

**Symptoms**: Slow response times, high CPU/memory usage

**Solutions**:
- Increase resources for containers/pods
- Optimize database queries and add indexes
- Configure proper caching
- Scale out the application horizontally

---

For additional assistance, please contact our DevOps team at devops@ndisuite.app

© 2025 NDISuite. All rights reserved.
