# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An internal web tool for Business Analysts/PMs to extract structured requirements (User Stories, NFRs, Open Questions) from unstructured documents using Google Gemini AI. Supports German and English input/output. See `SPEC.md` for full requirements and `BLUEPRINT.md` for the 18-prompt implementation plan.

**Status**: Prompts 1–9 complete (backend fully implemented). Frontend scaffold only. `todo.md` tracks remaining tasks.

### What's done

| Prompt | Focus | Status |
|--------|-------|--------|
| 1 | Project scaffold, Docker Compose, env config | ✅ Complete |
| 2 | DB models, Alembic migration, test fixtures | ✅ Complete |
| 3 | JWT authentication (login, `get_current_user`) | ✅ Complete |
| 4 | Project CRUD API with user isolation | ✅ Complete |
| 5 | File parsing service (PDF, DOCX, XLSX, PPTX, TXT, MD) | ✅ Complete |
| 6 | Session creation endpoint + background task stub | ✅ Complete |
| 7 | Gemini integration (client, prompt builder, response parser) | ✅ Complete |
| 8 | Item CRUD endpoints (UserStory, NFR, OpenQuestion) | ✅ Complete |
| 9 | Export endpoints (JSON, Markdown) | ✅ Complete |
| 10 | React foundation (routing, auth context, axios client) | ⚠️ Scaffold only |
| 11–18 | Frontend pages, components, E2E tests, polish | ❌ Not started |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (served via Nginx in Docker)
- **Backend**: Python 3.12 + FastAPI (async, JWT auth, BackgroundTasks)
- **AI**: Google Gemini 1.5 Pro (structured JSON output mode)
- **Database**: PostgreSQL 16 + SQLAlchemy 2.x + Alembic
- **File parsing**: PyMuPDF (PDF), python-docx (DOCX), openpyxl (XLSX), python-pptx (PPTX)

## Commands

```bash
# Start all services
docker compose up --build

# Backend only (for development)
cd backend && uvicorn app.main:app --reload

# Run all backend tests
pytest backend/tests/

# Run a single test
pytest backend/tests/test_auth.py::test_login_success -v

# Frontend dev server (proxies /api to localhost:8000)
cd frontend && npm run dev

# Frontend production build
cd frontend && npm run build

# E2E tests (Playwright) — not yet implemented
cd frontend && npm run e2e

# Database migrations
docker compose exec backend alembic upgrade head

# Create the first user
docker compose exec backend python -m scripts.create_user --email admin@example.com --password secret
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

### Backend File Structure

```
backend/
  pyproject.toml          # All Python dependencies
  Dockerfile              # python:3.12-slim, uvicorn entrypoint
  alembic.ini
  alembic/
    env.py                # Imports Base, reads DATABASE_URL
    versions/
      001_initial_schema.py  # ✅ Creates all 7 tables
  app/
    __init__.py
    main.py               # ✅ FastAPI app, CORS (localhost:3000), /health, mounts /api/v1
    config.py             # ✅ pydantic-settings v2 (DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, etc.)
    database.py           # ✅ SQLAlchemy engine, SessionLocal, get_db() dependency
    models.py             # ✅ All 7 SQLAlchemy models (see Data Model below)
    auth/
      __init__.py
      utils.py            # ✅ hash_password, verify_password, create_access_token, decode_access_token
      dependencies.py     # ✅ get_current_user (OAuth2PasswordBearer → JWT → User)
    api/
      __init__.py         # ✅ Main APIRouter; includes auth + projects sub-routers
      auth.py             # ✅ POST /auth/login (OAuth2PasswordRequestForm → token)
      projects.py         # ✅ GET/POST /projects, GET/DELETE /projects/{id}
      sessions.py         # ✅ POST /projects/{id}/sessions (202), GET /sessions/{id}/status, GET /sessions/{id}
      items.py            # ✅ PATCH/DELETE/POST restore for user-stories, nfrs, questions
      export.py           # ✅ GET /sessions/{id}/export?format=json|markdown
    schemas/
      __init__.py
      project.py          # ✅ ProjectCreate, ProjectResponse (with session_count)
      session.py          # ✅ SessionCreate, SessionResponse, SessionStatusResponse
      items.py            # ✅ UserStoryUpdate, NFRUpdate, OpenQuestionUpdate + response schemas
    services/
      __init__.py
      file_parser.py      # ✅ FileParser, ParsedDocument, validate_total_size
      gemini_client.py    # ✅ GeminiClient (JSON mode, structured output)
      prompt_builder.py   # ✅ Builds extraction prompt (DE/EN, all item types)
      response_parser.py  # ✅ Parses Gemini JSON response into DB models
      extraction_service.py  # ✅ Background task: parse → prompt → Gemini → persist → status
      exporter.py         # ✅ JSON and Markdown export formatters
  scripts/
    create_user.py        # ✅ CLI: --email, --password; bcrypt hash; duplicate email guard
  tests/
    conftest.py           # ✅ db_session fixture (creates/drops tables), client fixture
    test_auth.py          # ✅ 5 tests: login success/fail, protected endpoints
    test_projects.py      # ✅ 8 tests: CRUD, user isolation
    test_file_parser.py   # ✅ 8 tests: all formats + validation errors
    test_sessions.py      # ✅ Session creation, status, full retrieval
    test_extraction.py    # ✅ Extraction pipeline (mocked Gemini)
    test_items.py         # ✅ Item CRUD, soft delete, restore
    test_export.py        # ✅ JSON and Markdown export
    fixtures/
      sample.txt          # ✅
      sample.md           # ✅
```

### Frontend File Structure

```
frontend/
  Dockerfile              # node:20-alpine build → nginx for production
  package.json            # React 18, React Router, React Query, Axios, Tailwind, Playwright
  vite.config.ts          # Proxy /api → localhost:8000
  tailwind.config.js
  src/
    main.tsx              # ✅ ReactDOM.render entry point
    App.tsx               # ⚠️ Placeholder only — no routing, no auth yet
    index.css             # ✅ Tailwind directives
    lib/
      api.ts              # ❌ Axios instance with JWT Authorization header interceptor
      format.ts           # ❌ formatBytes utility
    context/
      AuthContext.tsx      # ❌ Auth state (token, user, login, logout)
    components/
      Layout.tsx           # ❌ Nav + page container
      ProtectedRoute.tsx   # ❌ Redirect to /login if unauthenticated
      UserStoryCard.tsx    # ❌ Read + inline edit
      NFRCard.tsx          # ❌ Read + inline edit
      OpenQuestionCard.tsx # ❌ Read + inline edit
      ExtractionProgress.tsx  # ❌ Polling spinner
      ExportMenu.tsx       # ❌ JSON/Markdown download dropdown
      UndoToast.tsx        # ❌ 5s undo notification
    hooks/
      useProjects.ts       # ❌ React Query: GET/POST/DELETE projects
      useCreateSession.ts  # ❌ POST /projects/{id}/sessions
      useSessionStatus.ts  # ❌ Polling GET /sessions/{id}/status
      useSession.ts        # ❌ GET /sessions/{id}
      useUpdateItem.ts     # ❌ PATCH items
      useExport.ts         # ❌ Download export file
    pages/
      LoginPage.tsx        # ❌
      ProjectsPage.tsx     # ❌ List + create + delete projects
      ProjectDetailPage.tsx  # ❌ Session history list
      NewSessionPage.tsx   # ❌ Text input + file upload + language selector
      SessionDetailPage.tsx  # ❌ Polling + results + inline edit
```

### Data Model

All entities use UUID PKs and have `created_at`/`updated_at` timestamps.
`UserStory`, `NonFunctionalRequirement`, and `OpenQuestion` use an `is_deleted` soft-delete flag.

```
User → Project → ExtractionSession
                      ├── SourceDocument (filename, file_type, raw_text)
                      ├── UserStory (title, as_who, i_want, so_that,
                      │            acceptance_criteria[], priority, labels[],
                      │            source_snippet, is_deleted, sort_order)
                      ├── NonFunctionalRequirement (title, category, description,
                      │                            metric, priority, source_snippet,
                      │                            is_deleted, sort_order)
                      └── OpenQuestion (question_text, owner, status,
                                       source_snippet, is_deleted, sort_order)
```

NFR categories: `Performance | Security | Usability | Reliability | Maintainability | Compliance`
Priority values: `low | medium | high | critical`
Session statuses: `pending | processing | completed | failed`
OpenQuestion statuses: `open | answered | deferred`

### Key Constraints

- File upload: 30 MB per file, 50 MB total per extraction
- Text input: 50–500,000 characters, 50-character minimum enforced in file parser
- Gemini token budget: ~50,000 tokens (~38,000 words)
- All DB queries are user-scoped (users only access their own data)
- No raw SQL — use SQLAlchemy ORM throughout
- Authentication: JWT HS256, 24-hour expiry, stored in localStorage

### Environment Variables

```
DATABASE_URL=postgresql://reqext:reqext@db:5432/reqext
SECRET_KEY=<random secret for JWT signing>
GEMINI_API_KEY=<Google AI Studio key>
JWT_ALGORITHM=HS256        # default
JWT_EXPIRE_HOURS=24        # default
MAX_FILE_SIZE_MB=30        # default
MAX_TOTAL_SIZE_MB=50       # default
```

Copy `.env.example` to `.env` and fill in `SECRET_KEY` and `GEMINI_API_KEY` before starting.

## Frontend Design System

### Anti-AI-Slop Rules (MANDATORY)
- NEVER use Inter, Roboto, Arial, or system-ui fonts
- NEVER use purple/violet gradients on white backgrounds
- NEVER default to centered layouts with uniform rounded corners
- NEVER use generic card shadows (shadow-md everywhere)
- All components must follow the design system defined in DESIGN.md (if present)

### Aesthetic Direction: "Editorial Utility"
This is a professional PM/BA tool — the design should feel like a well-crafted 
editorial dashboard, not a generic SaaS template.
- **Typography**: Use a distinctive sans-serif pair from Google Fonts 
  (e.g. DM Sans for headings + Source Sans 3 for body, or similar)
- **Color palette**: Define via CSS variables in index.css. 
  Use a strong primary accent (not blue-500) with muted neutrals.
  Dark sidebar or top nav for visual weight.
- **Layout**: Left-aligned content, asymmetric grid where appropriate, 
  generous whitespace but information-dense where it matters (session results, item cards)
- **Motion**: Subtle staggered reveals on page load, smooth tab transitions. 
  No bouncing or excessive animation.
- **Cards/Items**: Vary border treatments (left accent border vs. full border), 
  avoid uniform rounded-xl on everything
- **Status badges**: Use distinct shapes/colors per status, not just color variations
- **Empty states**: Illustrated or iconographic, not just grey text

## Key Conventions

### Backend

- **Router location**: all API endpoints live in `backend/app/api/`, not `app/routers/`
- **Auth helpers**: `backend/app/auth/utils.py` and `backend/app/auth/dependencies.py` (not `app/deps.py`)
- **Dependency injection**: always use `get_current_user = Depends(get_current_user)` for protected routes
- **User isolation**: every DB query that returns user data must filter by `current_user.id`
- **Schemas**: Pydantic v2 models live in `backend/app/schemas/`; use `model_config = ConfigDict(from_attributes=True)` for ORM models
- **Error responses**: use `HTTPException` with a machine-readable `detail` string (e.g. `INVALID_CREDENTIALS`, `PROJECT_NOT_FOUND`)
- **No raw SQL**: all queries via SQLAlchemy ORM

### Testing

- Test DB is SQLite in-memory (configured in `conftest.py`)
- Each test gets a fresh database (tables created/dropped per test via `db_session` fixture)
- `client` fixture wraps `TestClient` with the test DB injected via dependency override
- Run tests from the repo root: `pytest backend/tests/`
- Fixture files for file-parsing tests are in `backend/tests/fixtures/`

### Frontend (when implementing)

- Axios client in `lib/api.ts` must attach `Authorization: Bearer <token>` from localStorage
- React Query is the data-fetching layer; no ad-hoc `fetch` calls in components
- All routes except `/login` are wrapped in `ProtectedRoute`
- Soft-delete flow: show `UndoToast` for 5s, then call `DELETE`; if undone, call restore endpoint

## API Endpoints (implemented)

```
GET    /health                                              # liveness check → {"status": "ok"}
POST   /api/v1/auth/login                                  # OAuth2 form → {access_token, token_type, expires_in}
GET    /api/v1/projects                                    # list user's projects [{id, name, session_count, ...}]
POST   /api/v1/projects                                    # create project → 201
GET    /api/v1/projects/{id}                               # single project or 404
DELETE /api/v1/projects/{id}                               # hard delete → 204
POST   /api/v1/projects/{id}/sessions                      # 202, starts background extraction
GET    /api/v1/sessions/{id}/status                        # {status, error_message}
GET    /api/v1/sessions/{id}                               # full session with all items
PATCH  /api/v1/sessions/{id}/user-stories/{item_id}
DELETE /api/v1/sessions/{id}/user-stories/{item_id}
POST   /api/v1/sessions/{id}/user-stories/{item_id}/restore
PATCH  /api/v1/sessions/{id}/nfrs/{item_id}
DELETE /api/v1/sessions/{id}/nfrs/{item_id}
POST   /api/v1/sessions/{id}/nfrs/{item_id}/restore
PATCH  /api/v1/sessions/{id}/questions/{item_id}
DELETE /api/v1/sessions/{id}/questions/{item_id}
POST   /api/v1/sessions/{id}/questions/{item_id}/restore
GET    /api/v1/sessions/{id}/export?format=json|markdown
```
