# Requirements Extractor Agent — Implementation Blueprint

**Based on**: SPEC.md v1.0
**Date**: 2026-02-19

---

## Step 1 — High-Level Blueprint

The project is a full-stack web application with three deployment units:

1. **React Frontend** — TypeScript, Tailwind CSS, served via Nginx in Docker
2. **FastAPI Backend** — Python 3.12, async, JWT auth, background tasks
3. **PostgreSQL 16** — Relational store for all entities

**Core data flow**:
1. User logs in → receives JWT token
2. User creates/selects a Project
3. User submits text/files + language selection → POST creates ExtractionSession (202)
4. Backend background task: parse files → build Gemini prompt → call API → parse response → persist items → set session status = completed
5. Frontend polls `/sessions/{id}/status` → when complete, loads full session
6. User edits/deletes/adds items inline → PATCH/DELETE/POST to individual item endpoints
7. User saves → items already persisted; save confirms the "draft" state
8. User exports → GET /sessions/{id}/export?format=markdown|json

**Key architectural decisions**:
- Background processing via FastAPI `BackgroundTasks` (sufficient for local/single-user deployment; no Celery needed)
- Gemini called with structured JSON output mode to ensure parseable responses
- Soft deletes with client-side undo (5s toast before actually calling DELETE)
- Frontend state managed with React Query (server state) + local useState (optimistic UI)

---

## Step 2 — Iterative Chunks

| Chunk | Deliverable | Tests |
|-------|------------|-------|
| A | Docker Compose + FastAPI skeleton + DB models + migrations | Health check passes |
| B | JWT auth — login endpoint + dependency | Auth tests pass |
| C | Project CRUD API | Integration tests pass |
| D | File parsing service (all formats + validation) | Unit tests pass |
| E | Extraction session creation + Gemini integration + polling | Full extraction flow works |
| F | Item CRUD (User Stories, NFRs, Open Questions) | Integration tests pass |
| G | Export endpoints (Markdown + JSON) | Output validates |
| H | React app — auth + projects dashboard | Login flow works |
| I | React extraction flow (upload → preview → edit → save) | E2E happy path passes |
| J | Error handling + accessibility + E2E error flows | All error cases handled |

---

## Step 3 — Steps per Chunk

### Chunk A: Infrastructure
- A1: Create `docker-compose.yml` (postgres, backend, frontend), folder structure
- A2: FastAPI app skeleton with `/health` endpoint, settings via pydantic-settings
- A3: SQLAlchemy models (all 6 tables) + Alembic initial migration
- A4: pytest configuration + test DB fixture

### Chunk B: Authentication
- B1: bcrypt password hashing utilities
- B2: JWT creation/verification utilities
- B3: `POST /api/v1/auth/login` endpoint
- B4: `get_current_user` dependency
- B5: CLI seed script to create first user

### Chunk C: Projects
- C1: `GET/POST/DELETE /api/v1/projects` endpoints
- C2: Integration tests for all project endpoints

### Chunk D: File Parsing
- D1: Base parser interface + TXT/MD parser
- D2: PDF parser (PyMuPDF)
- D3: DOCX parser (python-docx)
- D4: XLSX parser (openpyxl)
- D5: PPTX parser (python-pptx)
- D6: File validation (MIME + extension + size)
- D7: Unit tests for all parsers + validation

### Chunk E: Extraction Engine
- E1: `POST /api/v1/projects/{id}/sessions` — creates session, starts background task (202)
- E2: Gemini prompt builder (structured JSON mode, DE/EN)
- E3: Gemini API client (google-generativeai)
- E4: Response parser (Gemini JSON → DB models)
- E5: Background task wiring (parse → Gemini → persist → status update)
- E6: `GET /sessions/{id}/status` polling endpoint
- E7: `GET /sessions/{id}` full session endpoint
- E8: Unit tests for prompt builder + response parser

### Chunk F: Item Management
- F1: User Story CRUD (PATCH + soft-DELETE + POST)
- F2: NFR CRUD
- F3: Open Question CRUD
- F4: Integration tests for all item endpoints

### Chunk G: Export
- G1: `GET /sessions/{id}/export?format=json` endpoint
- G2: `GET /sessions/{id}/export?format=markdown` endpoint

### Chunk H: React Foundation
- H1: Vite + React 18 + TypeScript + Tailwind setup in Docker
- H2: React Query + axios client with JWT interceptor
- H3: Login page + auth context + protected route
- H4: Projects dashboard (list, create, delete)
- H5: Project detail page (session list)

### Chunk I: Extraction Flow UI
- I1: New extraction form (text area + file dropzone + language selector)
- I2: Polling hook + progress indicator component
- I3: Session results layout (3 tabs)
- I4: User Story card with inline editing
- I5: NFR card with inline editing
- I6: Open Question card with inline editing
- I7: Source snippet expand/collapse
- I8: Add item forms (all three types)
- I9: Delete + undo toast (5s)
- I10: Export buttons (copy, download MD, download JSON)

### Chunk J: Polish
- J1: Global error boundary + API error display
- J2: All backend error codes wired to frontend messages
- J3: Loading skeletons + empty states
- J4: Playwright E2E — happy path
- J5: Playwright E2E — error flows

---

## Step 4 — Right-Size Review

All steps reviewed:
- **Too large**: E5 (background task wiring) touches many modules — acceptable as it's integration glue; tests in E8 cover components
- **Too small**: G1+G2 could merge — kept separate since JSON and Markdown have different rendering logic
- **Just right**: Most steps map to 1–3 files and ~100–200 lines of code
- **Order verified**: Each prompt builds only on previously established code

---

## Step 5 — LLM Prompts

---

### Prompt 1 — Project Scaffold & Docker Compose

````
You are building a "Requirements Extractor Agent" — an internal web tool for Business Analysts that uses Google Gemini to extract structured User Stories, NFRs, and Open Questions from uploaded documents.

Stack:
- Backend: Python 3.12, FastAPI, PostgreSQL 16, SQLAlchemy 2.x, Alembic
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Deployment: Docker Compose

## Task
Create the complete project scaffold from scratch. Produce these files:

### 1. Folder structure
```
requirements-extractor/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   └── api/
│   │       └── __init__.py
│   ├── tests/
│   │   └── __init__.py
│   ├── alembic/
│   │   └── env.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
└── docker-compose.yml
```

### 2. `docker-compose.yml`
- Service `db`: postgres:16-alpine, port 5432, volume for persistence, env: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- Service `backend`: build from ./backend, port 8000, depends_on db, env vars: DATABASE_URL, SECRET_KEY, GEMINI_API_KEY
- Service `frontend`: build from ./frontend, port 3000, depends_on backend
- Use an `.env` file for secrets (include `.env.example` with placeholder values)

### 3. `backend/app/config.py`
Use `pydantic-settings` (v2). Settings class reads from environment:
- `DATABASE_URL: str`
- `SECRET_KEY: str`
- `GEMINI_API_KEY: str`
- `JWT_ALGORITHM: str = "HS256"`
- `JWT_EXPIRE_HOURS: int = 24`
- `MAX_FILE_SIZE_MB: int = 30`
- `MAX_TOTAL_SIZE_MB: int = 50`

### 4. `backend/app/main.py`
- Create FastAPI app with title "Requirements Extractor API"
- Include CORS middleware allowing `http://localhost:3000`
- Mount router at `/api/v1`
- Add `GET /health` endpoint returning `{"status": "ok"}`

### 5. `backend/Dockerfile`
- python:3.12-slim
- Install dependencies via pyproject.toml
- Run with `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### 6. `backend/pyproject.toml`
Include all dependencies:
- fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, pydantic-settings
- python-jose[cryptography], passlib[bcrypt]
- google-generativeai
- PyMuPDF, python-docx, openpyxl, python-pptx
- python-multipart
- pytest, pytest-asyncio, httpx (dev deps)

### 7. `frontend/Dockerfile`
- node:20-alpine, build with `npm run build`, serve with nginx

### 8. `.env.example`
```
DATABASE_URL=postgresql://reqext:reqext@db:5432/reqext
SECRET_KEY=change-me-in-production
GEMINI_API_KEY=your-gemini-api-key-here
```

After completing this prompt, running `docker compose up --build` should start all three services with the backend `/health` endpoint returning 200.
````

---

### Prompt 2 — Database Models & Alembic Migration

````
You are continuing to build a "Requirements Extractor Agent". The project scaffold from the previous step is already in place (FastAPI backend, PostgreSQL via Docker Compose, SQLAlchemy configured).

## Task
Define all SQLAlchemy ORM models and create the initial Alembic database migration.

### 1. `backend/app/models.py`

Create SQLAlchemy 2.x declarative models using `DeclarativeBase`. All primary keys are UUIDs (use `uuid.uuid4` as default). All timestamps use `func.now()`. Include:

**User**
- id: UUID PK
- email: String(255), unique, not null
- password_hash: String(255), not null
- created_at: DateTime

**Project**
- id: UUID PK
- user_id: UUID FK → users.id ON DELETE CASCADE
- name: String(255), not null
- description: Text, nullable
- created_at: DateTime
- updated_at: DateTime, nullable

**ExtractionSession**
- id: UUID PK
- project_id: UUID FK → projects.id ON DELETE CASCADE
- title: String(255), nullable
- output_language: String(2), default='de'
- status: String(20), default='pending'  # pending | processing | completed | failed
- error_message: Text, nullable
- created_at: DateTime

**SourceDocument**
- id: UUID PK
- session_id: UUID FK → extraction_sessions.id ON DELETE CASCADE
- filename: String(255)
- file_type: String(10)  # pdf|docx|txt|md|xlsx|pptx|text
- raw_text: Text
- created_at: DateTime

**UserStory**
- id: UUID PK
- session_id: UUID FK → extraction_sessions.id ON DELETE CASCADE
- title: String(500), not null
- as_who: Text, not null
- i_want: Text, not null
- so_that: Text, not null
- acceptance_criteria: ARRAY(Text), nullable (use postgresql.ARRAY)
- priority: String(10), default='medium'
- labels: ARRAY(Text), nullable
- source_snippet: Text, nullable
- is_deleted: Boolean, default=False
- sort_order: Integer, nullable
- created_at: DateTime
- updated_at: DateTime, nullable

**NonFunctionalRequirement**
- id: UUID PK
- session_id: UUID FK → extraction_sessions.id ON DELETE CASCADE
- title: String(500), not null
- category: String(50), not null  # performance|security|usability|reliability|maintainability|compliance
- description: Text, nullable
- metric: String(500), nullable
- priority: String(10), default='medium'
- source_snippet: Text, nullable
- is_deleted: Boolean, default=False
- sort_order: Integer, nullable
- created_at: DateTime
- updated_at: DateTime, nullable

**OpenQuestion**
- id: UUID PK
- session_id: UUID FK → extraction_sessions.id ON DELETE CASCADE
- question_text: Text, not null
- owner: String(255), nullable
- status: String(20), default='open'  # open | resolved
- source_snippet: Text, nullable
- is_deleted: Boolean, default=False
- sort_order: Integer, nullable
- created_at: DateTime
- updated_at: DateTime, nullable

### 2. `backend/app/database.py`
- Create async-compatible SQLAlchemy engine using `DATABASE_URL` from settings
- Create `SessionLocal` factory
- Provide `get_db` dependency that yields a session

### 3. Alembic setup
- Configure `backend/alembic/env.py` to import `Base` from `app.models` and use `DATABASE_URL` from config
- Generate initial migration file `backend/alembic/versions/001_initial_schema.py` with all tables
- Include `upgrade()` that creates all tables in correct order (users → projects → extraction_sessions → source_documents → user_stories → non_functional_requirements → open_questions)
- Include `downgrade()` that drops them in reverse order

### 4. `backend/tests/conftest.py`
- pytest fixture `db_session` that creates a fresh test database (use `DATABASE_URL` with a test DB suffix, or use SQLite with `check_same_thread=False` for tests)
- Fixture creates all tables before each test, drops after
- Fixture `client` that provides a TestClient with `db_session` injected

After this prompt: `alembic upgrade head` should create all 7 tables in PostgreSQL.
````

---

### Prompt 3 — JWT Authentication

````
You are continuing to build a "Requirements Extractor Agent". The database models and Docker infrastructure are in place. Now implement JWT authentication.

## Task

### 1. `backend/app/auth/utils.py`
Implement these functions:

```python
def hash_password(plain: str) -> str:
    """Hash password with bcrypt, cost factor 12."""

def verify_password(plain: str, hashed: str) -> bool:
    """Verify plain password against bcrypt hash."""

def create_access_token(user_id: str) -> str:
    """Create JWT with sub=user_id, exp=now+JWT_EXPIRE_HOURS."""

def decode_access_token(token: str) -> dict:
    """Decode and validate JWT. Raises HTTPException 401 on invalid/expired."""
```

Use `passlib` for bcrypt (rounds=12) and `python-jose` for JWT.

### 2. `backend/app/auth/dependencies.py`
```python
async def get_current_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")),
    db: Session = Depends(get_db)
) -> User:
    """Decode JWT, load user from DB, raise 401 if not found."""
```

### 3. `backend/app/api/auth.py`
Endpoint: `POST /auth/login`
- Accept `OAuth2PasswordRequestForm` (form data: username=email, password)
- Look up user by email in DB
- Verify password with `verify_password`
- On success: return `{"access_token": "...", "token_type": "bearer", "expires_in": 86400}`
- On failure: raise `HTTPException(401, detail={"error": "INVALID_CREDENTIALS", "message": "Email oder Passwort falsch."})`

### 4. `backend/app/api/__init__.py`
Create main APIRouter and include auth router at prefix `/auth`.

### 5. Wire into `backend/app/main.py`
Include the main APIRouter at `/api/v1`.

### 6. `backend/scripts/create_user.py`
CLI script (run with `python -m scripts.create_user`):
- Accept `--email` and `--password` arguments
- Hash password with bcrypt
- Insert user into DB (handle duplicate email gracefully)
- Print "User created: {email}"

### 7. Tests: `backend/tests/test_auth.py`
Write pytest tests using the `client` fixture from conftest:
- `test_login_success`: POST /auth/login with valid credentials → 200, access_token present
- `test_login_wrong_password`: → 401, error = "INVALID_CREDENTIALS"
- `test_login_unknown_email`: → 401
- `test_protected_endpoint_without_token`: GET /projects → 401
- `test_protected_endpoint_with_token`: GET /projects with valid bearer token → 200 (empty list)

For tests, seed a test user in the fixture using `hash_password` directly on the DB.

After this prompt: `POST /api/v1/auth/login` returns a valid JWT; protected endpoints return 401 without token.
````

---

### Prompt 4 — Project CRUD API

````
You are continuing to build a "Requirements Extractor Agent". Auth (JWT login, get_current_user dependency) is fully working. Now implement the Projects API.

## Context
- All endpoints require `Authorization: Bearer <token>`
- Users can only access their own projects (filter by `user_id = current_user.id`)
- Base URL: `http://localhost:8000/api/v1`

## Task

### 1. `backend/app/schemas/project.py`
Pydantic v2 schemas:

```python
class ProjectCreate(BaseModel):
    name: str  # min_length=1, max_length=255
    description: str | None = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    session_count: int  # computed field
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
```

### 2. `backend/app/api/projects.py`
Router with prefix `/projects`:

**GET /**
- Query all non-deleted projects for current user
- Include session_count (subquery or join)
- Return list of ProjectResponse sorted by created_at DESC

**POST /**
- Create project with user_id = current_user.id
- Return 201 with ProjectResponse

**GET /{project_id}**
- Return single project (404 if not found or not owned by user)

**DELETE /{project_id}**
- Hard delete (cascade deletes sessions/items via DB)
- Return 204

### 3. Wire into main router
Add projects router to the main APIRouter (from Step 3) at prefix `/projects`.

### 4. Tests: `backend/tests/test_projects.py`
Using `client` fixture + a helper `auth_headers(client)` that logs in and returns `{"Authorization": "Bearer ..."}`:

- `test_list_projects_empty`: GET /projects → 200, empty list
- `test_create_project`: POST with name → 201, id and name present
- `test_create_project_missing_name`: POST with empty name → 422
- `test_list_projects_returns_created`: create 2 projects, list returns 2
- `test_get_project_by_id`: create, then GET /{id} → 200
- `test_get_project_not_found`: GET /nonexistent-uuid → 404
- `test_delete_project`: create, delete → 204, then GET returns 404
- `test_user_isolation`: create project as user A, user B cannot see it (create second test user in DB)

After this prompt: full CRUD for projects works and is properly isolated per user.
````

---

### Prompt 5 — File Parsing Service

````
You are continuing to build a "Requirements Extractor Agent". The backend has auth and project CRUD. Now implement the file parsing layer.

## Task
Build a unified file parsing service that extracts plain text from all supported document formats.

### 1. `backend/app/services/file_parser.py`

```python
from dataclasses import dataclass

@dataclass
class ParsedDocument:
    filename: str
    file_type: str  # pdf | docx | xlsx | pptx | txt | md | text
    raw_text: str
    char_count: int
```

Implement a `FileParser` class with:

```python
class FileParser:
    SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.md', '.xlsx', '.pptx'}
    SUPPORTED_MIME_TYPES = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'text/plain': '.txt',
        'text/markdown': '.md',
    }

    def validate_file(self, filename: str, content_type: str, size_bytes: int) -> None:
        """Raise HTTPException with structured error codes if invalid."""

    def parse(self, filename: str, content: bytes, content_type: str) -> ParsedDocument:
        """Dispatch to correct parser based on extension."""
```

Validation rules (raise `HTTPException(400, detail={"error": "...", "message": "..."})`:
- Extension not in SUPPORTED_EXTENSIONS → `INVALID_FILE_TYPE`
- MIME type doesn't match extension → `INVALID_FILE_TYPE`
- size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024 → `FILE_TOO_LARGE` (include filename in message)

After parsing, if `len(raw_text.strip()) < 50` → raise `HTTPException(422, detail={"error": "NO_TEXT_EXTRACTED", ...})`

Implement private methods:
- `_parse_pdf(content: bytes) -> str` — use PyMuPDF (`fitz`), extract text from all pages, join with newlines
- `_parse_docx(content: bytes) -> str` — use python-docx, extract paragraph texts
- `_parse_xlsx(content: bytes) -> str` — use openpyxl, iterate all sheets/rows/cells, join non-empty values with tabs/newlines
- `_parse_pptx(content: bytes) -> str` — use python-pptx, extract text from all slides/shapes
- `_parse_text(content: bytes) -> str` — decode as UTF-8, fallback to latin-1

### 2. Total size validation
In `backend/app/services/file_parser.py`, add:
```python
def validate_total_size(files: list[UploadFile], settings: Settings) -> None:
    """Raise HTTPException 400 with TOTAL_SIZE_EXCEEDED if sum of sizes > MAX_TOTAL_SIZE_MB."""
```

### 3. Tests: `backend/tests/test_file_parser.py`
Use real test fixture files in `backend/tests/fixtures/`:
- `sample.txt` — a plain text file with 100+ characters
- `sample.md` — markdown content

For other formats, generate minimal valid files programmatically in tests using the same libraries (python-docx, openpyxl, etc. to create in-memory files).

Tests:
- `test_parse_txt`: parses .txt, returns text content
- `test_parse_md`: parses .md
- `test_parse_docx`: creates minimal docx in memory, parses it
- `test_parse_xlsx`: creates minimal xlsx in memory with 3 rows, parses to text
- `test_parse_pptx`: creates minimal pptx in memory with text shape
- `test_validate_unsupported_extension`: .exe → INVALID_FILE_TYPE
- `test_validate_file_too_large`: 31 MB → FILE_TOO_LARGE
- `test_validate_total_size_exceeded`: two files totaling 51 MB → TOTAL_SIZE_EXCEEDED
- `test_empty_document_raises`: file with only whitespace → NO_TEXT_EXTRACTED

After this prompt: all document formats can be parsed to plain text, with proper validation errors.
````

---

### Prompt 6 — Extraction Session Creation & Polling

````
You are continuing to build a "Requirements Extractor Agent". Auth, projects, and file parsing are all working. Now implement the extraction session creation endpoint that accepts text/files and immediately returns 202 while processing happens in the background.

## Task

### 1. `backend/app/schemas/session.py`
```python
class SessionCreateResponse(BaseModel):
    session_id: UUID
    status: str  # "processing"

class SessionStatusResponse(BaseModel):
    status: str
    progress_message: str | None = None
    error_message: str | None = None

class UserStoryResponse(BaseModel):
    id: UUID
    title: str
    as_who: str
    i_want: str
    so_that: str
    acceptance_criteria: list[str] | None = []
    priority: str
    labels: list[str] | None = []
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class NFRResponse(BaseModel):
    id: UUID
    title: str
    category: str
    description: str | None = None
    metric: str | None = None
    priority: str
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class OpenQuestionResponse(BaseModel):
    id: UUID
    question_text: str
    owner: str | None = None
    status: str
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class SessionDetailResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str | None
    output_language: str
    status: str
    user_stories: list[UserStoryResponse]
    non_functional_requirements: list[NFRResponse]
    open_questions: list[OpenQuestionResponse]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

### 2. `backend/app/api/sessions.py`
Router with prefix `/projects/{project_id}/sessions` for creation, plus `/sessions` for retrieval.

**POST /projects/{project_id}/sessions**
Accept `multipart/form-data`:
- `text_input: str | None` — direct text (min 50 chars if no files)
- `files: list[UploadFile] | None`
- `output_language: str = "de"` (must be "de" or "en")
- `title: str | None`

Validation:
- Project must exist and belong to current user → 404
- At least one of text_input or files required → 422
- Validate each file with FileParser.validate_file()
- Validate total size with validate_total_size()

Process:
1. Create ExtractionSession with status='pending'
2. For each file: read bytes (store in list, do NOT persist file)
3. If text_input: create SourceDocument with file_type='text', filename='direct_input'
4. Call `background_tasks.add_task(run_extraction, session_id, ...)` — pass list of (filename, bytes, content_type) tuples + text_input + output_language
5. Return 202 with `{"session_id": "...", "status": "processing"}`

**GET /sessions/{session_id}**
- Load session with all non-deleted items (is_deleted=False)
- Items sorted by sort_order ASC, created_at ASC
- Return SessionDetailResponse
- 404 if not found or not accessible to current user (check via project.user_id)

**GET /sessions/{session_id}/status**
- Return SessionStatusResponse (just status + progress_message)
- 404 if not accessible

### 3. Wire into main router
Add sessions router to the main APIRouter. Note: the creation endpoint is under `/projects/{project_id}/sessions` but the GET endpoints are under `/sessions/{session_id}` — handle this with two separate routers or path prefixes.

### 4. Background task stub
Create `backend/app/services/extraction_service.py` with:
```python
async def run_extraction(
    session_id: str,
    file_inputs: list[tuple[str, bytes, str]],  # (filename, content, content_type)
    text_input: str | None,
    output_language: str,
    db_url: str  # pass DATABASE_URL since BackgroundTasks run outside request context
) -> None:
    """Placeholder: sets session status to 'completed' without calling Gemini yet."""
    # Create new DB session (cannot reuse request session in background task)
    # Set status = 'processing'
    # TODO: parse files, call Gemini, persist items
    # Set status = 'completed'
```

The Gemini integration will be added in the next prompt. For now the background task just sets status to 'completed' after a 1-second sleep.

### 5. Tests: `backend/tests/test_sessions.py`
- `test_create_session_text_only`: POST with text_input only → 202, session_id returned
- `test_create_session_status_polling`: create session, poll /status → returns status
- `test_create_session_wrong_project`: POST to project not owned → 404
- `test_create_session_no_input`: no text + no files → 422
- `test_get_session_returns_empty_items`: session created, GET → empty lists (stub doesn't extract)
- `test_session_not_accessible_by_other_user`: create session as user A, user B gets 404

After this prompt: sessions can be created (202), status can be polled, and the GET returns the session structure.
````

---

### Prompt 7 — Gemini Integration & Extraction Engine

````
You are continuing to build a "Requirements Extractor Agent". Extraction sessions are created and background tasks run. Now implement the Gemini AI integration to actually extract requirements.

## Task

### 1. `backend/app/services/gemini_client.py`
```python
import google.generativeai as genai

class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-pro")

    async def extract_requirements(self, text: str, output_language: str) -> dict:
        """
        Call Gemini with structured output prompt.
        Returns parsed dict with keys: user_stories, non_functional_requirements, open_questions.
        Raises ExtractionError on API failure.
        """
```

### 2. `backend/app/services/prompt_builder.py`
Build the Gemini prompt. The prompt must instruct Gemini to return a JSON object only (no markdown fences), with this exact structure:

```json
{
  "user_stories": [
    {
      "title": "short title",
      "as_who": "Als [Rolle]",
      "i_want": "möchte ich [Aktion]",
      "so_that": "damit [Nutzen]",
      "acceptance_criteria": ["criterion 1", "criterion 2"],
      "priority": "medium",
      "labels": [],
      "source_snippet": "max 500 chars from original text"
    }
  ],
  "non_functional_requirements": [
    {
      "title": "short title",
      "category": "performance",
      "description": "...",
      "metric": "< 2s response time",
      "priority": "medium",
      "source_snippet": "..."
    }
  ],
  "open_questions": [
    {
      "question_text": "...",
      "owner": null,
      "source_snippet": "..."
    }
  ]
}
```

For German output (`output_language="de"`): User Story fields must be in German ("Als...", "möchte ich...", "damit...").
For English (`"en"`): format as "As a...", "I want to...", "so that...".

The prompt should:
- Clearly explain each field
- Instruct to return ONLY the JSON object, no explanation
- Limit source_snippet to max 500 characters
- Set categories strictly to: performance|security|usability|reliability|maintainability|compliance
- Set priorities to: low|medium|high|critical

```python
def build_extraction_prompt(text: str, output_language: str) -> str:
    """Return the full prompt string."""
```

### 3. `backend/app/services/response_parser.py`
```python
def parse_gemini_response(response_text: str) -> dict:
    """
    Parse JSON from Gemini response.
    - Strip any accidental markdown fences (```json ... ```)
    - Parse JSON
    - Validate structure (must have all 3 keys)
    - Return dict or raise ResponseParseError
    """

def map_to_db_models(parsed: dict, session_id: str) -> dict:
    """
    Convert parsed dict to lists of SQLAlchemy model instances.
    Returns {"user_stories": [...], "nfrs": [...], "questions": [...]}
    """
```

### 4. Update `backend/app/services/extraction_service.py`
Replace the stub with the full implementation:

```python
async def run_extraction(session_id, file_inputs, text_input, output_language, db_url):
    db = create_session(db_url)
    try:
        session = db.get(ExtractionSession, session_id)
        session.status = 'processing'
        db.commit()

        # 1. Parse all files
        parser = FileParser()
        documents = []
        warnings = []
        for filename, content, content_type in file_inputs:
            try:
                doc = parser.parse(filename, content, content_type)
                documents.append(doc)
            except HTTPException as e:
                warnings.append(e.detail.get("message"))

        # 2. Add text input
        if text_input:
            documents.append(ParsedDocument("direct_input", "text", text_input, len(text_input)))

        # 3. Persist SourceDocuments
        for doc in documents:
            db.add(SourceDocument(session_id=session_id, filename=doc.filename,
                                  file_type=doc.file_type, raw_text=doc.raw_text))

        # 4. Build combined text (truncate to ~150,000 chars to stay within token limits)
        combined_text = "\n\n---\n\n".join(doc.raw_text for doc in documents)[:150_000]

        # 5. Call Gemini
        client = GeminiClient(settings.GEMINI_API_KEY)
        response = await client.extract_requirements(combined_text, output_language)

        # 6. Persist items
        for i, story in enumerate(response.get("user_stories", [])):
            db.add(UserStory(session_id=session_id, sort_order=i, **story))
        for i, nfr in enumerate(response.get("non_functional_requirements", [])):
            db.add(NonFunctionalRequirement(session_id=session_id, sort_order=i, **nfr))
        for i, q in enumerate(response.get("open_questions", [])):
            db.add(OpenQuestion(session_id=session_id, sort_order=i, **q))

        session.status = 'completed'
        if warnings:
            session.error_message = "Warnings: " + "; ".join(warnings)
        db.commit()

    except Exception as e:
        session.status = 'failed'
        session.error_message = str(e)
        db.commit()
        raise
    finally:
        db.close()
```

### 5. Tests: `backend/tests/test_extraction.py`
Use `unittest.mock.patch` to mock Gemini API calls:

- `test_prompt_builder_german`: output contains "Als", "möchte ich", "damit"
- `test_prompt_builder_english`: output contains "As a", "I want to", "so that"
- `test_response_parser_valid`: valid JSON string → parsed dict with 3 keys
- `test_response_parser_strips_fences`: JSON wrapped in ```json ... ``` → still parses
- `test_response_parser_invalid_json`: garbage string → ResponseParseError
- `test_full_extraction_mocked`: mock GeminiClient.extract_requirements to return sample data → verify UserStory, NFR, OpenQuestion rows created in test DB

After this prompt: full extraction pipeline works end-to-end with Gemini (or mocked Gemini in tests).
````

---

### Prompt 8 — Item CRUD Endpoints

````
You are continuing to build a "Requirements Extractor Agent". The full extraction pipeline works. Now implement the CRUD endpoints for editing extracted items.

## Task

### 1. `backend/app/schemas/items.py`

**UserStory schemas:**
```python
class UserStoryUpdate(BaseModel):
    title: str | None = None
    as_who: str | None = None
    i_want: str | None = None
    so_that: str | None = None
    acceptance_criteria: list[str] | None = None
    priority: Literal['low', 'medium', 'high', 'critical'] | None = None
    labels: list[str] | None = None

class UserStoryCreate(BaseModel):
    title: str  # required
    as_who: str
    i_want: str
    so_that: str
    acceptance_criteria: list[str] = []
    priority: Literal['low', 'medium', 'high', 'critical'] = 'medium'
    labels: list[str] = []
```

**NFR schemas:**
```python
class NFRUpdate(BaseModel):
    title: str | None = None
    category: Literal['performance','security','usability','reliability','maintainability','compliance'] | None = None
    description: str | None = None
    metric: str | None = None
    priority: Literal['low', 'medium', 'high', 'critical'] | None = None

class NFRCreate(BaseModel):
    title: str
    category: Literal['performance','security','usability','reliability','maintainability','compliance']
    description: str | None = None
    metric: str | None = None
    priority: Literal['low', 'medium', 'high', 'critical'] = 'medium'
```

**OpenQuestion schemas:**
```python
class OpenQuestionUpdate(BaseModel):
    question_text: str | None = None
    owner: str | None = None
    status: Literal['open', 'resolved'] | None = None

class OpenQuestionCreate(BaseModel):
    question_text: str
    owner: str | None = None
```

### 2. `backend/app/api/items.py`
Router with NO prefix (paths are full):

For each item type (user-stories / non-functional-requirements / open-questions):

**PATCH /sessions/{session_id}/user-stories/{item_id}**
- Load item, verify session belongs to current user (404 otherwise)
- Apply only non-None fields from UserStoryUpdate
- Set updated_at = now()
- Return updated UserStoryResponse (200)

**DELETE /sessions/{session_id}/user-stories/{item_id}**
- Set is_deleted = True (soft delete)
- Return 204

**POST /sessions/{session_id}/user-stories**
- Create new UserStory linked to session_id
- sort_order = (max existing sort_order + 1) or 0
- Return 201 with UserStoryResponse

Implement identical endpoints for NFRs (`NFRResponse`, `NFRCreate`, `NFRUpdate`) and Open Questions (`OpenQuestionResponse`, `OpenQuestionCreate`, `OpenQuestionUpdate`).

Add a **restore** endpoint for each type:
**POST /sessions/{session_id}/user-stories/{item_id}/restore**
- Set is_deleted = False
- Return 200 with item

Wire items router into the main APIRouter.

### 3. Tests: `backend/tests/test_items.py`
Helper: `create_session_with_items(client, auth_headers, project_id)` — creates a session and returns it with mock items inserted directly into DB.

For User Stories:
- `test_patch_user_story`: PATCH single field → updated
- `test_patch_partial`: only update title, other fields unchanged
- `test_patch_not_found`: non-existent ID → 404
- `test_delete_user_story_soft`: DELETE → 204; GET session → item not in list
- `test_restore_user_story`: DELETE then POST restore → item appears again
- `test_add_user_story`: POST → 201, appears in GET session
- `test_add_user_story_invalid`: missing required field → 422

Write equivalent tests for NFR and OpenQuestion (can be more concise — test at least PATCH and DELETE for each).

After this prompt: all item types support inline edit, soft delete, restore, and manual creation.
````

---

### Prompt 9 — Export Endpoints

````
You are continuing to build a "Requirements Extractor Agent". All backend features (auth, projects, extraction, item CRUD) are working. Now implement the export endpoints.

## Task

### 1. `backend/app/services/exporter.py`

```python
class SessionExporter:
    def to_json(self, session: ExtractionSession) -> dict:
        """
        Return full session as dict with all non-deleted items.
        Include all fields for each item type.
        Add top-level meta: session_id, project_id, title, output_language, exported_at.
        """

    def to_markdown(self, session: ExtractionSession) -> str:
        """
        Return session as Markdown string.

        Format:
        # {session.title or "Extraction Session"}
        *Exported: {datetime}*

        ## User Stories

        ### US-1: {title}
        **Als** {as_who}
        **möchte ich** {i_want}
        **damit** {so_that}

        **Priority:** {priority}
        **Labels:** {labels}

        **Acceptance Criteria:**
        - criterion 1
        - criterion 2

        <details><summary>Source</summary>{source_snippet}</details>

        ---

        ## Non-Functional Requirements
        (table with columns: # | Title | Category | Metric | Priority)

        ## Open Questions
        (numbered list with status)
        """
```

Filter out items where `is_deleted = True`.

### 2. `backend/app/api/export.py`
```python
@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: UUID,
    format: Literal["json", "markdown"] = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
```

- Load session (verify ownership, 404 if not found)
- If format="json": return JSONResponse with Content-Disposition: attachment; filename="session_{id}.json"
- If format="markdown": return Response with media_type="text/markdown", Content-Disposition: attachment; filename="session_{id}.md"
- Unsupported format → 400

### 3. Wire export router into main router.

### 4. Tests: `backend/tests/test_export.py`
Setup: create session with 2 user stories, 1 NFR, 1 open question (direct DB insert), 1 deleted user story.

- `test_export_json`: GET /sessions/{id}/export?format=json → 200, valid JSON, deleted items excluded
- `test_export_markdown`: GET /sessions/{id}/export?format=markdown → 200, text/markdown, contains "## User Stories"
- `test_export_invalid_format`: format=csv → 400
- `test_export_unauthorized`: other user → 404
- `test_json_structure`: exported JSON has meta.session_id, user_stories array, NFRs, questions

After this prompt: users can download their session as JSON or Markdown.
````

---

### Prompt 10 — React App Foundation

````
You are continuing to build a "Requirements Extractor Agent". The backend is complete. Now bootstrap the React frontend.

## Task
Set up the React 18 + TypeScript + Vite + Tailwind frontend with auth state management and routing.

### 1. Install dependencies
Update `frontend/package.json` to include:
- react, react-dom (18.x)
- react-router-dom (v6)
- @tanstack/react-query (v5)
- axios
- @types/react, @types/react-dom, typescript
- tailwindcss, postcss, autoprefixer

### 2. `frontend/src/lib/api.ts`
Create an axios instance:
```typescript
const api = axios.create({ baseURL: '/api/v1' });

// Request interceptor: add Authorization header from localStorage token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, clear token and redirect to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 3. `frontend/src/context/AuthContext.tsx`
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}
```

- Initialize from localStorage
- `login()`: store token to localStorage, update state
- `logout()`: remove from localStorage, redirect to /login

### 4. `frontend/src/components/ProtectedRoute.tsx`
Redirect to `/login` if not authenticated.

### 5. `frontend/src/pages/LoginPage.tsx`
A clean login form:
- Email + Password fields
- Submit button "Anmelden"
- On submit: POST /auth/login, store token via `auth.login()`, redirect to `/`
- Show error message on 401: "Email oder Passwort falsch."
- Show loading state during request

Style with Tailwind: centered card, reasonable whitespace, accessible labels.

### 6. `frontend/src/App.tsx`
```typescript
// Routes:
// / → redirect to /projects
// /login → LoginPage (public)
// /projects → ProjectsPage (protected)
// /projects/:projectId → ProjectDetailPage (protected)
// /projects/:projectId/sessions/new → NewSessionPage (protected)
// /sessions/:sessionId → SessionDetailPage (protected)
```

### 7. `frontend/src/main.tsx`
Wrap app in `QueryClientProvider` and `AuthProvider`.

### 8. Vite proxy config (`frontend/vite.config.ts`)
```typescript
server: {
  proxy: {
    '/api': 'http://backend:8000'  // In Docker; localhost:8000 for local dev
  }
}
```

### 9. Tailwind config
Configure content paths to include `./src/**/*.{ts,tsx}`.

The app should compile and show the login page at `http://localhost:3000/login`. After login, it should redirect to `/projects` (empty page for now).
````

---

### Prompt 11 — Projects Dashboard

````
You are continuing to build a "Requirements Extractor Agent". The React app has auth, routing, and an API client. Now build the projects dashboard.

## Task

### 1. `frontend/src/hooks/useProjects.ts`
Using React Query v5:

```typescript
// useProjects(): query for GET /projects
// useCreateProject(): mutation for POST /projects
// useDeleteProject(): mutation for DELETE /projects/{id}
```

### 2. `frontend/src/pages/ProjectsPage.tsx`
Full page layout:
- Header: "Meine Projekte" + "Neues Projekt" button (opens modal)
- Project grid (or list): each card shows project name, description snippet, session_count, created_at
- Empty state: "Noch keine Projekte — erstelle dein erstes Projekt"
- Loading state: skeleton cards (3 placeholder cards with pulse animation)
- Click on project card → navigate to `/projects/{id}`

**CreateProjectModal** (inline component):
- Modal with backdrop
- Fields: Name (required), Description (optional textarea)
- Submit: "Projekt erstellen" → calls useCreateProject, closes modal on success
- Shows inline validation: name is required

**Delete flow**:
- Each card has a delete icon button (visible on hover)
- Click → confirmation inline ("Projekt löschen?" + Bestätigen / Abbrechen)
- On confirm: calls useDeleteProject, removes from list

### 3. `frontend/src/pages/ProjectDetailPage.tsx`
- Header: Project name + back button to `/projects`
- Section: "Extraktions-Sessions" + "Neue Extraktion" button → navigates to `/projects/{id}/sessions/new`
- List of sessions (title or fallback "Session vom {date}", status badge, item counts)
- Each session row is clickable → `/sessions/{id}`
- Empty state: "Noch keine Extraktionen"
- Loading skeletons

API calls needed:
- `GET /projects/{id}` → project details
- `GET /sessions/{id}` for each session is too expensive — instead, add a `GET /projects/{id}/sessions` endpoint to the backend that returns session summaries.

**Backend addition needed (add to `backend/app/api/sessions.py`):**
```python
@router.get("/projects/{project_id}/sessions", response_model=list[SessionSummaryResponse])
```

```python
class SessionSummaryResponse(BaseModel):
    id: UUID
    title: str | None
    status: str
    output_language: str
    user_story_count: int  # count of non-deleted items
    nfr_count: int
    question_count: int
    created_at: datetime
```

Use subqueries or joins to compute counts efficiently.

### 4. `frontend/src/components/Layout.tsx`
Shared layout with:
- Top navigation bar: app name "Requirements Extractor" on left, logout button on right
- Main content area with max-width container

Wrap all protected pages in `<Layout>`.

After this prompt: users can see all their projects, create new ones, delete them, and navigate to project details with session lists.
````

---

### Prompt 12 — New Extraction Form

````
You are continuing to build a "Requirements Extractor Agent". Projects and navigation work. Now build the new extraction form page.

## Task

### 1. `frontend/src/pages/NewSessionPage.tsx`

A form page at `/projects/:projectId/sessions/new` with:

**Section 1: Input Source**
Two tabs: "Text eingeben" and "Dateien hochladen"

*Text tab*:
- Textarea (min-height 200px) with placeholder "Füge hier deinen Text ein (E-Mail, Meeting-Notizen, Briefing...)"
- Character counter (bottom right of textarea): "X / 500,000 Zeichen"
- Validation: if submitting with only text, min 50 chars

*File tab*:
- Drag-and-drop zone with dotted border
- "Dateien hierher ziehen oder klicken zum Auswählen"
- Accept: `.pdf,.docx,.txt,.md,.xlsx,.pptx`
- Show selected files as chips with filename, size, and ✕ remove button
- Per-file size validation (> 30 MB → error chip in red)
- Total size warning (> 50 MB → orange banner)

**Section 2: Configuration**
- Title field (optional): "Sitzungstitel (optional)"
- Language dropdown: "Ausgabesprache" → options: "🇩🇪 Deutsch", "🇬🇧 English"
- Default: Deutsch

**Section 3: Actions**
- "Extraktion starten" button (primary, full-width on mobile)
- Disabled until valid input (text ≥ 50 chars OR at least one valid file)
- "Abbrechen" link back to project detail

**On submit:**
```typescript
// Build FormData with text_input (if text tab), files (if file tab), output_language, title
// POST /projects/{projectId}/sessions
// On 202: navigate to /sessions/{session_id} (which will show polling UI)
// On 4xx: show error banner with error.detail.message
```

### 2. `frontend/src/hooks/useCreateSession.ts`
```typescript
function useCreateSession(projectId: string) {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/projects/${projectId}/sessions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
  });
}
```

### 3. File size formatting utility
`frontend/src/lib/format.ts`:
```typescript
export function formatBytes(bytes: number): string
// "1.2 MB", "512 KB", etc.
```

After this prompt: users can enter text or upload files, configure language, and submit to start an extraction — which redirects to the session detail page.
````

---

### Prompt 13 — Extraction Progress & Results Layout

````
You are continuing to build a "Requirements Extractor Agent". The new extraction form submits and redirects to `/sessions/:sessionId`. Now build the session detail page with polling and results layout.

## Task

### 1. `frontend/src/hooks/useSessionStatus.ts`
```typescript
function useSessionStatus(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['session-status', sessionId],
    queryFn: () => api.get(`/sessions/${sessionId}/status`).then(r => r.data),
    refetchInterval: (data) => {
      // Poll every 2 seconds while status is pending|processing
      if (!data || ['pending', 'processing'].includes(data.status)) return 2000;
      return false; // Stop polling when done
    },
    enabled,
  });
}
```

### 2. `frontend/src/hooks/useSession.ts`
```typescript
function useSession(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.get(`/sessions/${sessionId}`).then(r => r.data),
    enabled, // Only fetch once status is 'completed' or 'failed'
  });
}
```

### 3. `frontend/src/components/ExtractionProgress.tsx`
Shown while status is 'pending' or 'processing':
- Large spinner in center
- Status message: "Dokument wird analysiert..." (or "Extraktion läuft...")
- Subtle pulse animation on text
- Auto-triggers `useSession` fetch when status flips to 'completed'

### 4. `frontend/src/pages/SessionDetailPage.tsx`
Orchestration logic:
```typescript
const { data: statusData } = useSessionStatus(sessionId, !isCompleted);
const isCompleted = statusData?.status === 'completed';
const isFailed = statusData?.status === 'failed';
const { data: session } = useSession(sessionId, isCompleted);
```

Render:
- If status is pending/processing: `<ExtractionProgress />`
- If status is failed: `<ExtractionError message={statusData.error_message} />`
- If status is completed and session loaded: `<SessionResults session={session} />`

### 5. `frontend/src/components/SessionResults.tsx`
Layout:
- Header: session title (or "Extraktion vom {date}") + export buttons (placeholder for now)
- Tab bar: "User Stories ({count})" | "NFRs ({count})" | "Offene Fragen ({count})"
- Active tab content area
- Footer: "Speichern" button (primary)

Each tab shows the respective items list.

For now, render placeholder cards (we'll add editing in the next prompt):
```typescript
// User Stories tab: list of <UserStoryCard story={story} /> (read-only for now)
// NFRs tab: list of <NFRCard nfr={nfr} />
// Open Questions tab: list of <OpenQuestionCard question={question} />
```

### 6. Basic card components (read-only)

**`UserStoryCard`**: Shows title, "Als/möchte/damit" in 3 rows, priority badge, labels. Source snippet as collapsed `<details>` element.

**`NFRCard`**: Shows title, category badge (color-coded), metric, description, priority badge. Source snippet collapsed.

**`OpenQuestionCard`**: Shows question_text, owner (if set), status badge (open=yellow, resolved=green). Source snippet collapsed.

### 7. `frontend/src/components/ExtractionError.tsx`
Error state with:
- "Extraktion fehlgeschlagen" heading
- error_message displayed
- "Erneut versuchen" button that navigates back to the new session form

After this prompt: the session page polls during extraction, shows progress, then displays results in tabs once complete.
````

---

### Prompt 14 — Inline Editing & Item Management

````
You are continuing to build a "Requirements Extractor Agent". The session results display in read-only cards. Now add full inline editing, item management, and the save/undo flow.

## Task

### 1. Local state management for session items

In `SessionDetailPage.tsx`, add local state for edits:
```typescript
// Track pending edits (items that have been modified but not yet confirmed saved)
// Use optimistic updates: update local state immediately, sync to backend on "Save"
const [localItems, setLocalItems] = useState<{
  userStories: UserStory[];
  nfrs: NFR[];
  openQuestions: OpenQuestion[];
} | null>(null);

// Initialize from server data when session loads
useEffect(() => {
  if (session && !localItems) {
    setLocalItems({
      userStories: session.user_stories,
      nfrs: session.non_functional_requirements,
      openQuestions: session.open_questions,
    });
  }
}, [session]);
```

### 2. Inline editing for UserStoryCard

Make `UserStoryCard` receive an `onUpdate: (id: string, changes: Partial<UserStory>) => void` prop.

Add edit mode toggle (pencil icon button in card header):
- In edit mode: all text fields become `<input>` or `<textarea>` elements
- Priority becomes a `<select>` with options low/medium/high/critical
- Labels: editable tag input (click ✕ to remove, press Enter to add)
- Acceptance criteria: textarea per item + "Add criterion" button
- Cancel button restores original values
- Clicking outside the card or pressing Escape cancels

When the user changes a value → call `onUpdate(id, {field: newValue})`.

### 3. Inline editing for NFRCard and OpenQuestionCard
Same pattern:
- NFRCard: title, category (select), description (textarea), metric, priority
- OpenQuestionCard: question_text (textarea), owner, status (select: open/resolved)

### 4. Delete + Undo toast

```typescript
// In SessionDetailPage
const [pendingDelete, setPendingDelete] = useState<{id: string, type: string, timer: number} | null>(null);

function handleDeleteItem(id: string, type: 'userStory' | 'nfr' | 'question') {
  // Remove from localItems immediately (optimistic)
  setLocalItems(prev => ({ ...prev, [type]: prev[type].filter(i => i.id !== id) }));
  // Show undo toast for 5 seconds
  const timer = setTimeout(() => {
    // Actually call DELETE endpoint after timeout
    callDeleteAPI(id, type);
    setPendingDelete(null);
  }, 5000);
  setPendingDelete({ id, type, timer });
}

function handleUndoDelete() {
  clearTimeout(pendingDelete.timer);
  // Restore item from backup
  setPendingDelete(null);
}
```

**`UndoToast`** component: fixed bottom-center, "Item gelöscht. [Rückgängig]" link, 5s countdown bar.

### 5. Add item buttons

Below each tab's item list:
- "+ User Story hinzufügen" button → expands an inline form with all required fields
- On submit: call POST /sessions/{id}/user-stories → add to localItems
- Same for NFRs and Open Questions

### 6. Save button behavior

```typescript
function useUpdateItem() {
  // Returns a function that PATCHes a single item by ID and type
}

async function handleSave() {
  setSaving(true);
  // For each item in localItems that differs from original server data:
  //   PATCH /sessions/{id}/user-stories/{itemId} with changed fields
  // On success: refetch session, show success toast "Gespeichert ✓"
  // On error: show error banner
  setSaving(false);
}
```

"Speichern" button shows spinner while saving. After save, button becomes "Gespeichert ✓" for 2 seconds.

After this prompt: users can edit all fields inline, delete items with 5s undo, add new items, and save all changes.
````

---

### Prompt 15 — Export UI & Copy to Clipboard

````
You are continuing to build a "Requirements Extractor Agent". Inline editing and save are working. Now add export functionality to the frontend.

## Task

### 1. `frontend/src/hooks/useExport.ts`
```typescript
function useExportSession(sessionId: string) {
  async function downloadExport(format: 'json' | 'markdown') {
    const response = await api.get(`/sessions/${sessionId}/export?format=${format}`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = format === 'json' ? `session_${sessionId}.json` : `session_${sessionId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return { downloadExport };
}
```

### 2. `frontend/src/components/ExportMenu.tsx`
A dropdown button in the SessionResults header:

"Exportieren ▾" → dropdown with:
- "📋 Alle kopieren (Markdown)" → calls copyToClipboard(markdownText)
- "⬇ Markdown herunterladen" → calls downloadExport('markdown')
- "⬇ JSON herunterladen" → calls downloadExport('json')

For "Alle kopieren (Markdown)": generate markdown client-side from `localItems` state (don't need a server round-trip):
```typescript
function generateMarkdownClientSide(session: Session): string {
  // Format user stories, NFRs, open questions as markdown
  // Same format as backend exporter
}
```

### 3. Per-item copy button
Add a copy icon button to each card (visible on hover):
- Copies single item as markdown to clipboard
- Shows "✓ Kopiert!" tooltip for 2 seconds after click

For UserStory:
```
**Als** {as_who}
**möchte ich** {i_want}
**damit** {so_that}
```

For NFR:
```
**[{category}]** {title}: {metric}
```

For OpenQuestion:
```
❓ {question_text}
```

### 4. Copy to clipboard utility
`frontend/src/lib/clipboard.ts`:
```typescript
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}
```

After this prompt: users can download their session as Markdown or JSON, and copy individual items or all items to clipboard.
````

---

### Prompt 16 — Error Handling & Empty States

````
You are continuing to build a "Requirements Extractor Agent". Core features are complete. Now add comprehensive error handling across the app.

## Task

### 1. Backend: Global error handler middleware

In `backend/app/main.py`, add exception handlers:

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(status_code=422, content={"error": "VALIDATION_ERROR", "message": str(exc.errors()[0]['msg'])})

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    # Log the error
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "INTERNAL_ERROR", "message": "Ein unerwarteter Fehler ist aufgetreten."})
```

### 2. Frontend: `ApiError` type

In `frontend/src/lib/api.ts`, define:
```typescript
export interface ApiError {
  error: string;  // error code
  message: string;  // human-readable message
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten.';
}
```

### 3. `frontend/src/components/ErrorBanner.tsx`
Reusable error banner:
```typescript
// Props: message: string, onRetry?: () => void, onDismiss?: () => void
// Red banner with error message
// Optional "Erneut versuchen" button
// Dismiss (✕) button
```

### 4. Error states for all pages

**LoginPage**: already has inline error (from Prompt 10). Ensure it uses `getApiErrorMessage`.

**ProjectsPage**:
- If loading fails: ErrorBanner with retry
- If create fails: inline error in modal

**NewSessionPage**:
- File validation errors: show inline under the file list
- Submission error: ErrorBanner above form
- Map specific error codes to friendly messages:
  - `FILE_TOO_LARGE` → "'{filename}' ist zu groß (max. 30 MB)"
  - `TOTAL_SIZE_EXCEEDED` → "Gesamtgröße überschreitet 50 MB"
  - `INVALID_FILE_TYPE` → "Dateiformat nicht unterstützt"

**SessionDetailPage**:
- Failed extraction: `<ExtractionError>` (already built) with the actual error message
- Save error: ErrorBanner in results footer
- Partial warning (when some files failed but others succeeded): yellow warning banner

### 5. Empty states

Ensure every list has a proper empty state:
- Projects list: "Noch keine Projekte. Erstelle dein erstes Projekt." + big "+" button
- Sessions list in project: "Noch keine Extraktionen. Starte eine neue Extraktion." + button
- User Stories tab (0 items): "Keine User Stories extrahiert."
- NFRs tab (0 items): "Keine nicht-funktionalen Anforderungen gefunden."
- Open Questions tab (0 items): "Keine offenen Fragen identifiziert."

### 6. Loading skeletons

Create `frontend/src/components/Skeleton.tsx`:
```typescript
// <Skeleton className="..." /> — animated pulse box
// <CardSkeleton /> — a card-shaped skeleton for lists
```

Apply to:
- Projects page while loading projects
- Project detail page while loading sessions
- Session detail page while session is loading after polling completes

After this prompt: all error cases are handled gracefully, every list has an empty state, and loading states use skeletons.
````

---

### Prompt 17 — End-to-End Tests (Happy Path)

````
You are continuing to build a "Requirements Extractor Agent". The full application is built. Now add Playwright end-to-end tests.

## Task

### 1. Setup
Add Playwright to the project:
```
frontend/e2e/
├── playwright.config.ts
├── fixtures.ts
└── tests/
    ├── auth.spec.ts
    ├── projects.spec.ts
    └── extraction.spec.ts
```

`frontend/package.json` additions:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  },
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

`playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e/tests',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'docker compose up',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

### 2. `e2e/fixtures.ts`
Test fixtures:
- `authenticatedPage`: a `Page` that is already logged in (seed user via API or DB before tests)
- `testProject`: creates a project via API before test, cleans up after

Use environment variables for test credentials: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

### 3. `e2e/tests/auth.spec.ts`
```typescript
test('login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/projects');
});

test('login with wrong password shows error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="login-error"]')).toContainText('Passwort falsch');
});

test('protected page redirects unauthenticated user', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL('/login');
});
```

### 4. `e2e/tests/projects.spec.ts`
```typescript
test('create and delete a project', async ({ authenticatedPage: page }) => {
  await page.goto('/projects');
  await page.click('button:has-text("Neues Projekt")');
  await page.fill('[name="projectName"]', 'Test E2E Project');
  await page.click('button:has-text("Projekt erstellen")');
  await expect(page.locator('text=Test E2E Project')).toBeVisible();

  // Delete
  await page.hover('text=Test E2E Project');
  await page.click('[data-testid="delete-project-btn"]');
  await page.click('button:has-text("Bestätigen")');
  await expect(page.locator('text=Test E2E Project')).not.toBeVisible();
});
```

### 5. `e2e/tests/extraction.spec.ts`
**Happy path — text input:**
```typescript
test('full extraction flow with text input', async ({ authenticatedPage: page, testProject }) => {
  await page.goto(`/projects/${testProject.id}/sessions/new`);

  // Switch to text tab
  await page.click('button:has-text("Text eingeben")');
  await page.fill('textarea', 'Als Kunde möchte ich meine Bestellungen online verfolgen können, damit ich jederzeit den aktuellen Status meiner Lieferung sehe. Das System muss dabei eine Antwortzeit von unter 2 Sekunden garantieren.');

  // Set language
  await page.selectOption('[name="output_language"]', 'de');

  // Submit
  await page.click('button:has-text("Extraktion starten")');

  // Wait for polling to complete (max 45s)
  await expect(page.locator('text=User Stories')).toBeVisible({ timeout: 45000 });

  // Verify at least 1 user story was extracted
  const userStoriesTab = page.locator('[data-testid="tab-user-stories"]');
  await expect(userStoriesTab).not.toContainText('(0)');
});
```

**Edit and save:**
```typescript
test('edit a user story and save', async ({ authenticatedPage: page, testProject }) => {
  // Navigate to an existing completed session (pre-created in fixture)
  await page.goto(`/sessions/${testProject.completedSessionId}`);
  await expect(page.locator('[data-testid="tab-user-stories"]')).toBeVisible();

  // Click edit on first user story
  await page.click('[data-testid="edit-story-btn"]').first();
  await page.fill('[data-testid="story-title-input"]', 'Bearbeiteter Titel');
  await page.click('button:has-text("Speichern")');

  // Verify saved
  await expect(page.locator('text=Gespeichert')).toBeVisible();
  await expect(page.locator('text=Bearbeiteter Titel')).toBeVisible();
});
```

Add `data-testid` attributes to key elements in the React components as needed (edit buttons, tab labels, form fields).

After this prompt: E2E tests cover login, project management, and the core extraction happy path.
````

---

### Prompt 18 — E2E Error Flow Tests & Final Polish

````
You are finalizing the "Requirements Extractor Agent". All features are implemented and happy-path E2E tests pass. Now add error-flow E2E tests and final polish.

## Task

### 1. `e2e/tests/extraction.spec.ts` — error flows

**File too large:**
```typescript
test('shows error for oversized file', async ({ authenticatedPage: page, testProject }) => {
  await page.goto(`/projects/${testProject.id}/sessions/new`);
  await page.click('button:has-text("Dateien hochladen")');

  // Create a 31MB fake file
  const bigFile = {
    name: 'big.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(31 * 1024 * 1024),
  };
  await page.setInputFiles('[data-testid="file-input"]', bigFile);

  // Error chip should appear
  await expect(page.locator('text=überschreitet das Maximum')).toBeVisible();
  // Submit button should be disabled
  await expect(page.locator('button:has-text("Extraktion starten")')).toBeDisabled();
});
```

**Delete with undo:**
```typescript
test('delete item and undo within 5 seconds', async ({ authenticatedPage: page, testProject }) => {
  await page.goto(`/sessions/${testProject.completedSessionId}`);
  await expect(page.locator('[data-testid="user-story-card"]').first()).toBeVisible();

  // Click delete on first story
  await page.click('[data-testid="delete-story-btn"]').first();

  // Item should be gone immediately
  const initialCount = await page.locator('[data-testid="user-story-card"]').count();

  // Undo toast appears
  await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible();

  // Click undo
  await page.click('text=Rückgängig');

  // Item restored
  await expect(page.locator('[data-testid="user-story-card"]')).toHaveCount(initialCount + 1);
});
```

**Manual add:**
```typescript
test('manually add a user story', async ({ authenticatedPage: page, testProject }) => {
  await page.goto(`/sessions/${testProject.completedSessionId}`);
  await page.click('button:has-text("User Story hinzufügen")');
  await page.fill('[data-testid="new-story-title"]', 'Manuell erstellte Story');
  await page.fill('[data-testid="new-story-as-who"]', 'Als Admin');
  await page.fill('[data-testid="new-story-i-want"]', 'möchte ich Nutzer verwalten');
  await page.fill('[data-testid="new-story-so-that"]', 'damit ich Zugriffe steuern kann');
  await page.click('button:has-text("Hinzufügen")');

  await expect(page.locator('text=Manuell erstellte Story')).toBeVisible();
});
```

### 2. Final UI polish — add data-testid attributes

Audit all components and add `data-testid` attributes where missing:
- `[data-testid="user-story-card"]` on each UserStoryCard
- `[data-testid="edit-story-btn"]` on edit button
- `[data-testid="delete-story-btn"]` on delete button
- `[data-testid="undo-toast"]` on UndoToast
- `[data-testid="file-input"]` on hidden file input
- `[data-testid="tab-user-stories"]`, `[data-testid="tab-nfrs"]`, `[data-testid="tab-questions"]`
- `[data-testid="login-error"]` on login error message

### 3. Accessibility audit

Run through the app and verify:
- All form fields have associated `<label>` elements (via `htmlFor`/`id`)
- All icon buttons have `aria-label` attributes (delete button, copy button, edit button)
- Tab navigation works (no focus traps except modals)
- Color contrast: primary blue on white ≥ 4.5:1
- Error messages are announced via `role="alert"` on error banners

Fix any accessibility issues found.

### 4. Final README

Create `README.md` with:
1. Prerequisites (Docker, Docker Compose, Google AI API key)
2. Quick start (clone → copy .env.example → add GEMINI_API_KEY → docker compose up)
3. Create first user: `docker compose exec backend python -m scripts.create_user --email admin@example.com --password yourpassword`
4. Open http://localhost:3000
5. Development setup (run backend/frontend locally without Docker)
6. Running tests

After this prompt: the application is fully tested, accessible, and documented.
````

---

## Summary: Prompt Sequence

| # | Prompt | Output |
|---|--------|--------|
| 1 | Project Scaffold | docker-compose.yml, folder structure, FastAPI skeleton, Dockerfiles |
| 2 | DB Models & Migrations | All SQLAlchemy models, Alembic migration |
| 3 | JWT Authentication | Login endpoint, auth dependency, tests |
| 4 | Projects API | CRUD endpoints, isolation tests |
| 5 | File Parsing | All 6 formats, validation, unit tests |
| 6 | Session Creation | 202 endpoint, polling, background stub |
| 7 | Gemini Integration | Prompt builder, response parser, full extraction |
| 8 | Item CRUD | PATCH/DELETE/POST for US, NFR, OQ |
| 9 | Export Endpoints | JSON + Markdown export |
| 10 | React Foundation | Vite + Tailwind, auth context, routing, login page |
| 11 | Projects Dashboard | List, create, delete, project detail |
| 12 | New Extraction Form | Text + file upload, language selector |
| 13 | Progress & Results | Polling, tabs, read-only cards |
| 14 | Inline Editing | Edit mode, delete/undo, add items, save |
| 15 | Export UI | Download, copy-to-clipboard |
| 16 | Error Handling | Error banners, empty states, skeletons |
| 17 | E2E Tests (Happy) | Auth, projects, extraction flow |
| 18 | E2E Tests (Errors) + Polish | Error flows, a11y, README |

**Total: 18 prompts → fully functional, tested, deployable application**
