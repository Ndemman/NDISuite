FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=ndisuite.settings

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    # Ensure we have OpenAI lib v1.66.0+ and HTTPX 0.27.0+ for compatibility with the API key
    pip install --no-cache-dir 'openai>=1.66.0' 'httpx>=0.27.0'

# Copy project files
COPY . .

# Skip collectstatic during development
# Static files will be served by Django's staticfiles app in DEBUG mode

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "ndisuite.wsgi:application"]
