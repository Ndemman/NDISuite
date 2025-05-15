# ─────────────────────────────────────────────────────────────
# Backend Dockerfile – build context: ./backend
# ─────────────────────────────────────────────────────────────
FROM python:3.10-slim

# Disable .pyc files & enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=ndisuite.settings

WORKDIR /app

# Install dependencies and curl for health checks
COPY requirements.txt ./
RUN apt-get update && apt-get install -y curl \
 && pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir "openai>=1.66.0" "httpx>=0.27.0"

# Copy application code
COPY . /app

# Expose default port
EXPOSE 8000

# Run migrations then start Gunicorn
CMD ["sh", "-c", "python manage.py migrate && \
                  gunicorn --bind 0.0.0.0:8000 ndisuite.wsgi:application"]
