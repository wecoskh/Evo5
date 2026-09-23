# EvO5 Production Deployment Guide

## Prerequisites
- Docker & Docker Compose v2+
- Domain name with DNS configured
- SSL certificates (Let's Encrypt recommended)
- MongoDB Atlas account (recommended) or self-hosted MongoDB

## Quick Start (Docker Compose)

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Generate JWT Secret
```bash
openssl rand -base64 32
# Paste output into .env JWT_SECRET
```

### 3. Deploy
```bash
docker compose up -d --build
```

### 4. Verify
```bash
docker compose ps
docker compose logs -f api
curl https://your-domain.com/api/health
```

## Production Checklist

### Security
- [ ] Strong JWT_SECRET (32+ chars, randomly generated)
- [ ] HTTPS enabled (configure reverse proxy with SSL)
- [ ] MongoDB authentication enabled
- [ ] Firewall: only ports 80/443 open publicly
- [ ] Rate limiting configured (already in code)
- [ ] Helmet security headers active
- [ ] CORS restricted to your domain only

### Database
- [ ] Use MongoDB Atlas or self-hosted with auth
- [ ] Enable backups (daily minimum)
- [ ] Configure connection pooling
- [ ] Set up monitoring/alerts

### Monitoring
- [ ] Health checks: `/api/health` and `/api/ready`
- [ ] Log aggregation (ELK, Datadog, etc.)
- [ ] APM for Node.js (New Relic, DataDog, etc.)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)

### Scaling
- [ ] Horizontal: run multiple API containers behind load balancer
- [ ] Vertical: increase container resources as needed
- [ ] CDN for static assets (Cloudflare, AWS CloudFront)
- [ ] Database read replicas for heavy read workloads

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | API port (default: 4000) |
| `API_HOST` | No | Bind address (default: 0.0.0.0) |
| `MONGO_URI` | Yes* | MongoDB connection string |
| `JWT_SECRET` | Yes | 32+ char random string |
| `FRONTEND_URL` | Yes | Your domain for CORS |
| `SEED` | No | Set `true` to seed demo data |

*Required unless using docker-compose's internal MongoDB

## SSL/HTTPS Setup (Recommended: Reverse Proxy)

### Nginx Example
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://web:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://api:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### With Docker Compose (add to compose file)
```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - web
      - api
```

## Database Migration (Dev → Prod)

```bash
# Export from dev
mongodump --uri="mongodb://localhost:27017/evo5" --out=./backup

# Import to prod (Atlas)
mongorestore --uri="mongodb+srv://..." --nsInclude=evo5.* ./backup/evo5
```

## Backup Strategy

```bash
# Daily cron job
0 2 * * * mongodump --uri="$MONGO_URI" --out=/backups/$(date +\%F) && \
  find /backups -type d -mtime +30 -exec rm -rf {} \;
```

## Updating

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Rollback

```bash
docker compose down
git checkout <previous-tag>
docker compose up -d --build
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API 503 | Check MongoDB connection, `docker compose logs mongodb` |
| CORS errors | Verify `FRONTEND_URL` matches exactly (including protocol) |
| JWT invalid | Ensure `JWT_SECRET` matches across all API instances |
| Slow queries | Add MongoDB indexes, check `explain()` on slow queries |
| Memory issues | Increase container limits, check for memory leaks |

## Support Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f web

# Shell into containers
docker compose exec api sh
docker compose exec mongodb mongosh

# Database admin
docker compose exec mongodb mongosh evo5 --eval "db.users.find()"

# Restart single service
docker compose restart api
```