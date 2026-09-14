FROM python:3.13-slim

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# HF Spaces runs containers as a non-root user with $HOME=/app;
# give the app writable dirs for the SQLite DB and CV uploads.
RUN mkdir -p uploads && chmod -R 777 /app

ENV UPLOAD_DIR=/app/uploads

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
