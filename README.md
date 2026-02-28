# Requirements Extractor

An internal web tool for Business Analysts and Project Managers to extract structured requirements (User Stories, NFRs, Open Questions) from unstructured documents using Google Gemini AI. Supports German and English input/output.

---

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) v2+
- A Google AI Studio API key ([get one here](https://aistudio.google.com/app/apikey)) with access to `gemini-2.5-flash`

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd requirements-extractor

# 2. Copy the environment template and fill in your secrets
cp .env.example .env
# Open .env and set:
#   SECRET_KEY=<random 32+ character string>
#   GEMINI_API_KEY=<your Google AI Studio key>

# 3. Build and start all services
docker compose up --build
```

All three services start together:

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:8000        |
| Database | localhost:5432 (internal)    |

---

## Create Your First User

```bash
docker compose exec backend python -m scripts.create_user \
  --email admin@example.com \
  --password yourpassword
```

Then open **http://localhost:3000** and log in.

---

## Development Setup (without Docker)

### Backend

```bash
cd backend

# Install dependencies (requires Python 3.12+)
pip install -e ".[dev]"

# Set environment variables (or export them)
export DATABASE_URL=postgresql://reqext:reqext@localhost:5432/reqext
export SECRET_KEY=dev-secret-key
export GEMINI_API_KEY=<your-key>

# Apply database migrations
alembic upgrade head

# Start the dev server with hot-reload
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server (proxies /api → localhost:8000)
npm run dev
```

The frontend dev server runs at **http://localhost:5173** and proxies all `/api` calls to the backend.

---

## Running Tests

### Backend (pytest)

```bash
# From the repo root — runs all backend tests against an in-memory SQLite DB
pytest backend/tests/

# Run a single test file
pytest backend/tests/test_auth.py -v

# Run a single test case
pytest backend/tests/test_auth.py::test_login_success -v
```

### Frontend (Playwright E2E)

The E2E tests require a running application stack (Docker or local dev servers) and a valid test user.

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run e2e

# Run with the Playwright UI
npx playwright test --ui
```

**Environment variables for E2E:**

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8000/api/v1` | Backend API base URL |
| `TEST_USER_EMAIL` | `test@test.com` | E2E test user email |
| `TEST_USER_PASSWORD` | `test123` | E2E test user password |
| `E2E_COMPLETED_SESSION` | _(empty)_ | Skip AI extraction; use `<session-id>:<project-id>` of a pre-existing completed session |

The `E2E_COMPLETED_SESSION` variable is useful in CI or when the Gemini API is unavailable — it lets the tests skip the extraction step and use a known-good session instead.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing secret (min. 32 chars) |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key |
| `JWT_ALGORITHM` | No | `HS256` | JWT algorithm |
| `JWT_EXPIRE_HOURS` | No | `24` | Token validity in hours |
| `MAX_FILE_SIZE_MB` | No | `30` | Per-file upload limit |
| `MAX_TOTAL_SIZE_MB` | No | `50` | Total upload limit per extraction |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS, served via Nginx
- **Backend**: Python 3.12 + FastAPI (async, JWT auth)
- **AI**: Google Gemini 2.5 Flash (structured JSON output)
- **Database**: PostgreSQL 16 + SQLAlchemy 2 + Alembic
- **File parsing**: PyMuPDF · python-docx · openpyxl · python-pptx
