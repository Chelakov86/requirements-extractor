FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required for psycopg2 and PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

# Install dependencies without building the project package itself
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
        fastapi \
        "uvicorn[standard]" \
        sqlalchemy \
        alembic \
        psycopg2-binary \
        pydantic-settings \
        "python-jose[cryptography]" \
        "passlib[bcrypt]" \
        google-generativeai \
        PyMuPDF \
        python-docx \
        openpyxl \
        python-pptx \
        python-multipart

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
