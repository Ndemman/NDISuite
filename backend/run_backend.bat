@echo off
set DEBUG=1
set POSTGRES_DB=ndisuite
set POSTGRES_USER=postgres
set POSTGRES_PASSWORD=postgres
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set REDIS_HOST=localhost
set REDIS_PORT=6379
set DJANGO_SECRET_KEY=dev_secret_key

python manage.py migrate
python manage.py runserver
