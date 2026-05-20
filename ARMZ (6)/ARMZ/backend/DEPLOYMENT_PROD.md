# Ubuntu VPS Production Deployment for ARMZ Django Backend

This project already includes production-ready components:

- `backend/config/settings_prod.py` → production settings loader (`DEBUG=False`)
- `backend/gunicorn.conf.py` → Gunicorn configuration
- `backend/Dockerfile.prod` → Docker build for backend
- `nginx/nginx.conf` and `nginx/conf.d/default.conf` → reverse proxy configuration for Docker Compose
- `docker-compose.yml` → full stack compose deployment with PostgreSQL, Redis, backend, frontend, Celery, and Nginx

## Recommended Ubuntu VPS deployment path

### Option 1: Native Ubuntu VPS (Gunicorn + Nginx)

Use this option when you want a non-Docker VPS deployment.

#### 1. Install required packages

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev build-essential libmysqlclient-dev nginx curl git
```

If you use PostgreSQL on the VPS:

```bash
sudo apt install -y postgresql postgresql-contrib
```

#### 2. Clone and prepare the repo

```bash
cd /srv
git clone <your-repo-url> armz
cd armz/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### 3. Configure environment variables

Create a production env file, for example `backend/.env.production`.
Use `backend/.env.example` as a template and update these values:

- `DEBUG=False`
- `SECRET_KEY` to a strong secret
- `ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com`
- `CORS_ALLOWED_ORIGINS=https://yourdomain.com`
- `CSRF_TRUSTED_ORIGINS=https://yourdomain.com`
- `DATABASE_URL` or MySQL / PostgreSQL connection values
- `REDIS_URL` if using Redis
- `EMAIL_*` settings for real email delivery
- `SECURE_SSL_REDIRECT=True`
- `SESSION_COOKIE_SECURE=True`
- `CSRF_COOKIE_SECURE=True`
- `SECURE_HSTS_SECONDS=31536000`

On Ubuntu, set the environment file path with:

```bash
export DJANGO_ENV_FILE=/srv/armz/backend/.env.production
export DJANGO_SETTINGS_MODULE=config.settings_prod
```

#### 4. Apply database migrations and collect static files

```bash
cd /srv/armz/backend
source .venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

#### 5. Create a Gunicorn systemd service

Create `/etc/systemd/system/gunicorn-armz.service` with:

```ini
[Unit]
Description=Gunicorn daemon for ARMZ backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/armz/backend
Environment="DJANGO_SETTINGS_MODULE=config.settings_prod"
Environment="DJANGO_ENV_FILE=/srv/armz/backend/.env.production"
Environment="PATH=/srv/armz/backend/.venv/bin"
ExecStart=/srv/armz/backend/.venv/bin/gunicorn config.wsgi:application --config /srv/armz/backend/gunicorn.conf.py
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Reload and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn-armz.service
sudo systemctl status gunicorn-armz.service
```

#### 6. Configure Nginx for production

Create `/etc/nginx/sites-available/armz`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /static/ {
        alias /srv/armz/backend/staticfiles/;
    }

    location /media/ {
        alias /srv/armz/backend/media/;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/armz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If you also deploy the React frontend on the VPS, instead serve the built static files from Nginx and adjust the `/` block accordingly.

#### 7. Use HTTPS

On Ubuntu, install Certbot and request certificates:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Then set `SECURE_SSL_REDIRECT=True` and ensure cookies are secure.

### Option 2: Docker Compose deployment

If you prefer container deployment, the repo already includes a full production compose stack:

- `docker-compose.yml`
- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod`
- `nginx/Dockerfile` + `nginx/conf.d/default.conf`

Use a VPS with Docker installed and run:

```bash
docker compose up -d --build
```

This will launch PostgreSQL, Redis, backend, Celery, frontend, and Nginx.

## Important production hardening notes

- Set `DEBUG=False`
- Set real `SECRET_KEY`
- Use correct `ALLOWED_HOSTS`
- Use proper `EMAIL_*` values for delivery
- Use secure cookies and HTTPS
- Validate `DATABASE_URL` / DB credentials
- Do not use the local SQLite database in production

## What is already production-ready in this repo

- `backend/gunicorn.conf.py` contains a reasonable worker count and logging
- `backend/config/settings.py` supports environment configuration and production flags
- `backend/config/settings_prod.py` exists to disable debug
- `backend/Dockerfile.prod` is optimized for production container builds
- `nginx/nginx.conf` and `nginx/conf.d/default.conf` already contain reverse proxy logic

## What still needs to be done for Ubuntu VPS

1. Create a production `.env.production` with secure values.
2. Install dependencies on the VPS.
3. Run migrations and collect static files.
4. Configure and enable systemd service for Gunicorn.
5. Configure Nginx to proxy to `127.0.0.1:8000` and serve static assets.
6. Enable SSL with Certbot.

---

### Notes

This project currently includes both Docker deployment and native production support. For a standard Ubuntu VPS, the recommended path is the native Gunicorn + Nginx approach above.
