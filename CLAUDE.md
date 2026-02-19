# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An internal web tool for Business Analysts/PMs to extract structured requirements (User Stories, NFRs, Open Questions) from unstructured documents using Google Gemini AI. Supports German and English input/output. See `SPEC.md` for full requirements and `BLUEPRINT.md` for the 10-chunk implementation plan.

**Status**: Specification complete, no source code implemented yet. `todo.md` tracks 134 implementation tasks.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (served via Nginx in Docker)
- **Backend**: Python 3.12 + FastAPI (async, JWT auth, BackgroundTasks)
- **AI**: Google Gemini 1.5 Pro (structured JSON output mode)
- **Database**: PostgreSQL 16 + SQLAlchemy + Alembic
- **File parsing**: PyMuPDF (PDF), python-docx (DOCX), openpyxl (XLSX), python-pptx (PPTX)

## Commands (once implemented)

```bash
# Start all services
docker compose up --build

# Backend only
cd backend && uvicorn app.main:app --reload

# Run backend tests
pytest backend/tests/

# Run a single test
pytest backend/tests/test_auth.py::test_login -v

# Frontend dev server
cd frontend && npm run dev

# Frontend build
cd frontend && npm run build

# E2E tests (Playwright)
cd frontend && npm run e2e

# Database migrations
docker compose exec backend alembic upgrade head

# Create first user (CLI seed script)
docker compose exec backend python -m scripts.create_user
```

## Architecture

### Data Flow

1. User authenticates → JWT token (24h, HS256, stored in localStorage)
2. User creates/selects Project → uploads files/text + selects output language (DE/EN)
3. `POST /api/v1/projects/{id}/sessions` returns 202; background task starts
4. Background task: parse files → build Gemini prompt → call API (JSON mode) → persist items → set session `status=completed`
5. Frontend polls `GET /sessions/{id}/status` → on completion, loads full session
6. User edits inline → `PATCH`/`DELETE`/`POST` to item endpoints
7. Soft deletes: client waits 5s before calling DELETE (toast undo window)
8. Export: `GET /sessions/{id}/export?format=markdown|json`

### Backend Structure (planned: `backend/`)

```
app/
  main.py           # FastAPI app, router registration
  settings.py       # pydantic-settings (DATABASE_URL, SECRET_KEY, GEMINI_API_KEY)
  models.py         # SQLAlchemy models (User, Project, ExtractionSession, SourceDocument, UserStory, NFR, OpenQuestion)
  routers/          # auth.py, projects.py, sessions.py, items.py, export.py
  services/
    file_parser.py  # dispatch by MIME type → format-specific parsers
    gemini_client.py
    extraction.py   # orchestrates parse → prompt → Gemini → persist
    export.py
  deps.py           # get_current_user dependency
alembic/            # migrations
tests/
scripts/create_user.py
```

### Frontend Structure (planned: `frontend/src/`)

```
main.tsx
App.tsx             # React Router routes
contexts/AuthContext.tsx
api/                # React Query hooks (useProjects, useSession, etc.)
pages/              # LoginPage, DashboardPage, ExtractionPage, SessionPage
components/         # UserStoryCard, NFRCard, QuestionCard, ExportButton, FileUpload
```

### Data Model

All entities use UUID PKs and have `created_at`/`updated_at` timestamps. UserStory/NFR/OpenQuestion use `is_deleted` soft delete flag.

```
User → Project → ExtractionSession
                      ├── SourceDocument (raw_text extracted from uploaded files)
                      ├── UserStory (as_who, i_want, so_that, acceptance_criteria[], priority, labels[])
                      ├── NonFunctionalRequirement (category, metric, priority)
                      └── OpenQuestion (question_text, owner, status)
```

NFR categories: `Performance | Security | Usability | Reliability | Maintainability | Compliance`
Priority values: `low | medium | high | critical`

### Key Constraints

- File upload: 30 MB per file, 50 MB total per extraction
- Text input: 50–500,000 characters
- Gemini token budget: ~50,000 tokens (~38,000 words)
- All DB queries are user-scoped (users only access their own data)
- No raw SQL — use SQLAlchemy ORM throughout

### Environment Variables

```
DATABASE_URL=postgresql://user:pass@db:5432/dbname
SECRET_KEY=<random secret for JWT signing>
GEMINI_API_KEY=<Google AI Studio key>
```
