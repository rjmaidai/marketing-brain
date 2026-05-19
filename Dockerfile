FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build deps + package
COPY pyproject.toml ./
COPY src/ ./src/
COPY data/ ./data/
COPY web/ ./web/

RUN pip install --upgrade pip && pip install .

EXPOSE 8000

# Railway / Fly / Render setzen $PORT — uvicorn liest ihn,
# lokal fällt es auf 8000 zurück.
CMD ["sh", "-c", "uvicorn marketing_brain.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
