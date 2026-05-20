# ARMZ Django Backend

## Stack
- Django 5.2
- Django REST Framework
- MySQL
- JWT (SimpleJWT)
- Razorpay integration hooks

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run migrations:
   - `python manage.py makemigrations`
   - `python manage.py migrate`
4. Create admin user:
   - `python manage.py createsuperuser`
5. Run server:
   - `python manage.py runserver 0.0.0.0:8000`

## Production (VPS)
1. Set environment with `DEBUG=False`, strong `SECRET_KEY`, and real `ALLOWED_HOSTS`.
2. Install and run gunicorn:
   - `gunicorn config.wsgi:application -c gunicorn.conf.py`
3. Put Nginx in front of gunicorn and forward `/static/` and `/media/`.
4. Run:
   - `python manage.py collectstatic --noinput`

## Production (Railway/Render)
1. Add environment variables from `.env.example`.
2. Use the included repo-root `render.yaml` or `Procfile` as a deployment starting point.
3. Payments are fail-closed in production, so real `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be configured.
4. Build command:
   - `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
5. Start command:
   - `gunicorn config.wsgi:application -c gunicorn.conf.py`

## Security Notes
- CSRF middleware enabled
- CORS restricted via `CORS_ALLOWED_ORIGINS`
- JWT authentication enabled
- Rate limiting enabled via DRF throttles
- Secure headers middleware enabled
- SQL injection mitigated by ORM-only queries

## Key Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/profile`
- `POST /payments/create-order`
- `POST /payments/verify`
- `POST /contact`
- `GET /reviews`

## Frontend API Base URL
- Set frontend `VITE_API_URL` to backend host, e.g. `https://api.yourdomain.com`
