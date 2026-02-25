# Requirements Extractor Agent — Todo Checklist

## Progress: 134/134 backend tasks complete + Prompts 10–14 ✅ (frontend foundation + projects dashboard + new extraction form + session detail page + inline editing done)

---

## Prompt 1 — Project Scaffold & Docker Compose ✅

- [x] Create root folder structure (`backend/`, `frontend/`, docker files)
  - [x] Create `backend/app/__init__.py`
  - [x] Create `backend/app/api/__init__.py`
  - [x] Create `backend/tests/__init__.py`
  - [x] Create `backend/alembic/` directory
  - [x] Create `frontend/src/` directory
- [x] Write `docker-compose.yml`
  - [x] `db` service: postgres:16-alpine, port 5432, named volume
  - [x] `backend` service: build ./backend, port 8000, depends_on db, env vars
  - [x] `frontend` service: build ./frontend, port 3000, depends_on backend
- [x] Write `.env.example` with `DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY` placeholders
- [x] Write `backend/app/config.py` (pydantic-settings v2)
  - [x] Fields: `DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`, `MAX_FILE_SIZE_MB`, `MAX_TOTAL_SIZE_MB`
- [x] Write `backend/app/main.py`
  - [x] FastAPI app with title "Requirements Extractor API"
  - [x] CORS middleware allowing `http://localhost:3000`
  - [x] Mount router at `/api/v1`
  - [x] `GET /health` → `{"status": "ok"}`
- [x] Write `backend/Dockerfile` (python:3.12-slim, uvicorn entrypoint)
- [x] Write `backend/pyproject.toml` with all dependencies
  - [x] Runtime: fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, pydantic-settings
  - [x] Runtime: python-jose[cryptography], passlib[bcrypt]
  - [x] Runtime: google-genai (migrated from deprecated google-generativeai)
  - [x] Runtime: PyMuPDF, python-docx, openpyxl, python-pptx, python-multipart
  - [x] Dev: pytest, pytest-asyncio, httpx
- [x] Write `frontend/Dockerfile` (node:20-alpine, nginx for production build)
- [x] Verify: `docker compose up --build` starts all 3 services, `GET /health` returns 200

---

## Prompt 2 — Database Models & Alembic Migration ✅

- [x] Write `backend/app/models.py` — SQLAlchemy 2.x `DeclarativeBase`
  - [x] `User` model (id UUID PK, email unique, password_hash, created_at)
  - [x] `Project` model (id, user_id FK→users cascade, name, description, created_at, updated_at)
  - [x] `ExtractionSession` model (id, project_id FK, title, output_language default='de', status default='pending', error_message, created_at)
  - [x] `SourceDocument` model (id, session_id FK, filename, file_type, raw_text, created_at)
  - [x] `UserStory` model (id, session_id FK, title, as_who, i_want, so_that, acceptance_criteria ARRAY, priority default='medium', labels ARRAY, source_snippet, is_deleted default=False, sort_order, created_at, updated_at)
  - [x] `NonFunctionalRequirement` model (id, session_id FK, title, category, description, metric, priority, source_snippet, is_deleted, sort_order, timestamps)
  - [x] `OpenQuestion` model (id, session_id FK, question_text, owner, status default='open', source_snippet, is_deleted, sort_order, timestamps)
- [x] Write `backend/app/database.py`
  - [x] SQLAlchemy engine from `DATABASE_URL`
  - [x] `SessionLocal` factory
  - [x] `get_db` dependency (yields session)
- [x] Configure `backend/alembic/env.py` to import `Base` and use `DATABASE_URL`
- [x] Generate `backend/alembic/versions/001_initial_schema.py`
  - [x] `upgrade()` creates all 7 tables in dependency order
  - [x] `downgrade()` drops them in reverse order
- [x] Write `backend/tests/conftest.py`
  - [x] `db_session` fixture (create tables before test, drop after)
  - [x] `client` fixture (TestClient with injected test DB)
- [x] Verify: `alembic upgrade head` creates all 7 tables

---

## Prompt 3 — JWT Authentication ✅

- [x] Write `backend/app/auth/utils.py`
  - [x] `hash_password(plain) -> str` (bcrypt, rounds=12)
  - [x] `verify_password(plain, hashed) -> bool`
  - [x] `create_access_token(user_id) -> str` (JWT HS256, exp = now + JWT_EXPIRE_HOURS)
  - [x] `decode_access_token(token) -> dict` (raises HTTPException 401 on invalid/expired)
- [x] Write `backend/app/auth/dependencies.py`
  - [x] `get_current_user` dependency (decode JWT, load User from DB, 401 if not found)
- [x] Write `backend/app/api/auth.py`
  - [x] `POST /auth/login` — accepts OAuth2PasswordRequestForm
  - [x] Lookup user by email, verify password
  - [x] Success: return `access_token`, `token_type`, `expires_in`
  - [x] Failure: `HTTPException(401)` with `INVALID_CREDENTIALS` error code
- [x] Update `backend/app/api/__init__.py` — create main APIRouter, include auth router at `/auth`
- [x] Wire main APIRouter into `backend/app/main.py` at `/api/v1`
- [x] Write `backend/scripts/create_user.py`
  - [x] Accept `--email` and `--password` CLI args
  - [x] Hash password, insert user, handle duplicate email
- [x] Write `backend/tests/test_auth.py`
  - [x] `test_login_success` → 200, access_token present
  - [x] `test_login_wrong_password` → 401, `INVALID_CREDENTIALS`
  - [x] `test_login_unknown_email` → 401
  - [x] `test_protected_endpoint_without_token` → 401
  - [x] `test_protected_endpoint_with_token` → 200

---

## Prompt 4 — Project CRUD API ✅

- [x] Write `backend/app/schemas/project.py`
  - [x] `ProjectCreate` schema (name required, description optional)
  - [x] `ProjectResponse` schema (with `session_count` computed field)
- [x] Write `backend/app/api/projects.py`
  - [x] `GET /projects` — list user's projects with session_count, sorted by created_at DESC
  - [x] `POST /projects` — create project, return 201
  - [x] `GET /projects/{project_id}` — single project, 404 if not found/not owned
  - [x] `DELETE /projects/{project_id}` — hard delete, return 204
- [x] Wire projects router into main APIRouter at `/projects`
- [x] Write `backend/tests/test_projects.py`
  - [x] Add `auth_headers(client)` helper
  - [x] `test_list_projects_empty` → 200, empty list
  - [x] `test_create_project` → 201, id and name present
  - [x] `test_create_project_missing_name` → 422
  - [x] `test_list_projects_returns_created` → 2 projects returned
  - [x] `test_get_project_by_id` → 200
  - [x] `test_get_project_not_found` → 404
  - [x] `test_delete_project` → 204, then GET returns 404
  - [x] `test_user_isolation` — user B cannot see user A's project

---

## Prompt 5 — File Parsing Service ✅

- [x] Write `backend/app/services/file_parser.py`
  - [x] `ParsedDocument` dataclass (filename, file_type, raw_text, char_count)
  - [x] `FileParser` class with `SUPPORTED_EXTENSIONS` and `SUPPORTED_MIME_TYPES` constants
  - [x] `validate_file(filename, content_type, size_bytes)` — raises HTTPException with structured error codes
    - [x] `INVALID_FILE_TYPE` for unsupported extension or mismatched MIME
    - [x] `FILE_TOO_LARGE` for > MAX_FILE_SIZE_MB
  - [x] `parse(filename, content, content_type) -> ParsedDocument` — dispatches to correct parser
  - [x] `_parse_pdf(content) -> str` — PyMuPDF, all pages joined with newlines
  - [x] `_parse_docx(content) -> str` — python-docx, paragraph texts
  - [x] `_parse_xlsx(content) -> str` — openpyxl, all sheets/rows/cells
  - [x] `_parse_pptx(content) -> str` — python-pptx, all slides/shapes
  - [x] `_parse_text(content) -> str` — UTF-8 decode, fallback latin-1
  - [x] After parsing: raise `NO_TEXT_EXTRACTED` (422) if text < 50 chars
  - [x] `validate_total_size(files, settings)` — raises `TOTAL_SIZE_EXCEEDED` (400) if sum > MAX_TOTAL_SIZE_MB
- [x] Create `backend/tests/fixtures/sample.txt` and `sample.md`
- [x] Write `backend/tests/test_file_parser.py`
  - [x] `test_parse_txt`
  - [x] `test_parse_md`
  - [x] `test_parse_docx` (create minimal docx in-memory)
  - [x] `test_parse_xlsx` (create minimal xlsx in-memory, 3 rows)
  - [x] `test_parse_pptx` (create minimal pptx with text shape)
  - [x] `test_validate_unsupported_extension` → `INVALID_FILE_TYPE`
  - [x] `test_validate_file_too_large` (31 MB) → `FILE_TOO_LARGE`
  - [x] `test_validate_total_size_exceeded` (two files = 51 MB) → `TOTAL_SIZE_EXCEEDED`
  - [x] `test_empty_document_raises` (whitespace-only file) → `NO_TEXT_EXTRACTED`

---

## Prompt 6 — Extraction Session Creation & Polling ✅

- [x] Write `backend/app/schemas/session.py`
  - [x] `SessionCreateResponse` (session_id, status)
  - [x] `SessionStatusResponse` (status, progress_message, error_message)
  - [x] `UserStoryResponse`
  - [x] `NFRResponse`
  - [x] `OpenQuestionResponse`
  - [x] `SessionDetailResponse` (with nested item lists)
- [x] Write `backend/app/api/sessions.py`
  - [x] `POST /projects/{project_id}/sessions` (multipart/form-data)
    - [x] Validate project exists and belongs to current user → 404
    - [x] Require at least text_input or files → 422
    - [x] Validate each file (FileParser.validate_file)
    - [x] Validate total size (validate_total_size)
    - [x] Create ExtractionSession with status='pending'
    - [x] Create SourceDocument for text_input if provided
    - [x] Call background_tasks.add_task(run_extraction, ...)
    - [x] Return 202 with session_id
  - [x] `GET /sessions/{session_id}` — full session with non-deleted items, sorted
  - [x] `GET /sessions/{session_id}/status` — status + progress_message
  - [x] `GET /projects/{project_id}/sessions` — session summaries with item counts (`SessionSummaryResponse`)
- [x] Wire session routers into main APIRouter
- [x] Write stub `backend/app/services/extraction_service.py`
  - [x] `run_extraction(...)` — creates own DB session, sets status=processing, sleeps 1s, sets status=completed
- [x] Write `backend/tests/test_sessions.py`
  - [x] `test_create_session_text_only` → 202, session_id returned
  - [x] `test_create_session_status_polling` → returns status
  - [x] `test_create_session_wrong_project` → 404
  - [x] `test_create_session_no_input` → 422
  - [x] `test_get_session_returns_empty_items` → lists are empty (stub)
  - [x] `test_session_not_accessible_by_other_user` → 404

---

## Prompt 7 — Gemini Integration & Extraction Engine ✅

- [x] Write `backend/app/services/gemini_client.py`
  - [x] `GeminiClient.__init__` — configure genai, create model instance
  - [x] `GeminiClient.extract_requirements(text, output_language) -> dict` — calls Gemini, returns parsed dict; raises `ExtractionError` on API failure
- [x] Write `backend/app/services/prompt_builder.py`
  - [x] `build_extraction_prompt(text, output_language) -> str`
  - [x] German output: "Als...", "möchte ich...", "damit..."
  - [x] English output: "As a...", "I want to...", "so that..."
  - [x] Specifies exact JSON output structure (no markdown fences)
  - [x] Limits source_snippet to 500 chars
  - [x] Constrains category values and priority values
- [x] Write `backend/app/services/response_parser.py`
  - [x] `parse_gemini_response(response_text) -> dict`
    - [x] Strip accidental markdown fences
    - [x] Parse JSON
    - [x] Validate 3 required keys present
    - [x] Raise `ResponseParseError` on failure
  - [x] `map_to_db_models(parsed, session_id) -> dict` — converts to SQLAlchemy model instances
- [x] Replace stub in `backend/app/services/extraction_service.py` with full implementation
  - [x] Creates own DB session (not request context)
  - [x] Sets status='processing'
  - [x] Parses all files (catches per-file errors, collects warnings)
  - [x] Handles text_input as SourceDocument
  - [x] Persists SourceDocuments
  - [x] Builds combined text (truncated to 150,000 chars)
  - [x] Calls GeminiClient.extract_requirements
  - [x] Persists UserStory, NFR, OpenQuestion rows with sort_order
  - [x] Sets status='completed' (or 'failed' on exception)
  - [x] Stores warnings in session.error_message if partial failures
- [x] Write `backend/tests/test_extraction.py`
  - [x] `test_prompt_builder_german` — output contains German story format
  - [x] `test_prompt_builder_english` — output contains English story format
  - [x] `test_response_parser_valid` — valid JSON → parsed dict with 3 keys
  - [x] `test_response_parser_strips_fences` — ```json ... ``` still parses
  - [x] `test_response_parser_invalid_json` — garbage → ResponseParseError
  - [x] `test_full_extraction_mocked` — mock GeminiClient, verify rows created in test DB

---

## Prompt 8 — Item CRUD Endpoints ✅

- [x] Write `backend/app/schemas/items.py`
  - [x] `UserStoryUpdate` (all optional fields)
  - [x] `UserStoryCreate` (title, as_who, i_want, so_that required)
  - [x] `NFRUpdate` (all optional)
  - [x] `NFRCreate` (title + category required)
  - [x] `OpenQuestionUpdate` (all optional)
  - [x] `OpenQuestionCreate` (question_text required)
- [x] Write `backend/app/api/items.py`
  - [x] `PATCH /sessions/{session_id}/user-stories/{item_id}` → 200
  - [x] `DELETE /sessions/{session_id}/user-stories/{item_id}` → 204 (soft delete)
  - [x] `POST /sessions/{session_id}/user-stories` → 201
  - [x] `POST /sessions/{session_id}/user-stories/{item_id}/restore` → 200
  - [x] `PATCH /sessions/{session_id}/nfrs/{item_id}` → 200
  - [x] `DELETE /sessions/{session_id}/nfrs/{item_id}` → 204
  - [x] `POST /sessions/{session_id}/nfrs` → 201
  - [x] `POST /sessions/{session_id}/nfrs/{item_id}/restore` → 200
  - [x] `PATCH /sessions/{session_id}/questions/{item_id}` → 200
  - [x] `DELETE /sessions/{session_id}/questions/{item_id}` → 204
  - [x] `POST /sessions/{session_id}/questions` → 201
  - [x] `POST /sessions/{session_id}/questions/{item_id}/restore` → 200
  - [x] All endpoints: verify session belongs to current user (404 otherwise)
  - [x] PATCH: apply only non-None fields, set updated_at = now()
  - [x] POST: sort_order = max existing + 1 or 0
- [x] Wire items router into main APIRouter
- [x] Write `backend/tests/test_items.py`
  - [x] Helper: `create_session_with_items(client, auth_headers, project_id)`
  - [x] `test_patch_user_story` — single field updated
  - [x] `test_patch_partial` — other fields unchanged
  - [x] `test_patch_not_found` → 404
  - [x] `test_delete_user_story_soft` → 204, not in GET session response
  - [x] `test_restore_user_story` → item reappears
  - [x] `test_add_user_story` → 201, appears in GET session
  - [x] `test_add_user_story_invalid` (missing field) → 422
  - [x] `test_patch_nfr` — at minimum PATCH test
  - [x] `test_delete_nfr` — soft delete
  - [x] `test_patch_open_question`
  - [x] `test_delete_open_question`

---

## Prompt 9 — Export Endpoints ✅

- [x] Write `backend/app/services/exporter.py`
  - [x] `SessionExporter.to_json(session) -> dict`
    - [x] Includes meta: session_id, project_id, title, output_language, exported_at
    - [x] Excludes is_deleted=True items
    - [x] All fields for each item type
  - [x] `SessionExporter.to_markdown(session) -> str`
    - [x] Header: title + export timestamp
    - [x] User Stories section: formatted with Als/möchte/damit, acceptance criteria as list
    - [x] Source snippets as `<details>` elements
    - [x] NFRs section: table with #, Title, Category, Metric, Priority columns
    - [x] Open Questions section: numbered list with status
    - [x] Excludes is_deleted=True items
- [x] Write `backend/app/api/export.py`
  - [x] `GET /sessions/{session_id}/export?format=json|markdown`
  - [x] Verify session ownership → 404
  - [x] JSON: JSONResponse with Content-Disposition attachment header
  - [x] Markdown: Response with `text/markdown` media type + attachment header
  - [x] Unsupported format → 400
- [x] Wire export router into main APIRouter
- [x] Write `backend/tests/test_export.py`
  - [x] Setup: session with 2 user stories, 1 NFR, 1 OQ, 1 deleted story (direct DB insert)
  - [x] `test_export_json` → 200, valid JSON, deleted items excluded
  - [x] `test_export_markdown` → 200, `text/markdown`, contains "## User Stories"
  - [x] `test_export_invalid_format` (csv) → 400
  - [x] `test_export_unauthorized` (other user) → 404
  - [x] `test_json_structure` — has meta.session_id, user_stories, non_functional_requirements, open_questions keys

---

## Prompt 10 — React App Foundation ✅

- [x] Configure `frontend/package.json` with all dependencies
  - [x] react, react-dom (18.x), react-router-dom (v6)
  - [x] @tanstack/react-query (v5), axios
  - [x] tailwindcss, postcss, autoprefixer
  - [x] @playwright/test (dev)
- [x] Configure `frontend/tailwind.config.js` with `./src/**/*.{ts,tsx}` content paths
- [x] Configure `frontend/vite.config.ts` with proxy `/api` → `http://backend:8000`
- [x] Write `frontend/src/lib/api.ts`
  - [x] Axios instance with baseURL `/api/v1`
  - [x] Request interceptor: add Bearer token from localStorage
  - [x] Response interceptor: on 401, clear token and redirect to /login
- [x] Write `frontend/src/context/AuthContext.tsx`
  - [x] `isAuthenticated`, `token`, `login(token)`, `logout()`
  - [x] Initialize from localStorage
  - [x] `logout()` removes token, redirects to /login
- [x] Write `frontend/src/components/ProtectedRoute.tsx` — redirect to /login if not authenticated
- [x] Write `frontend/src/pages/LoginPage.tsx`
  - [x] Email + Password fields with labels
  - [x] "Anmelden" submit button
  - [x] POST /auth/login, store token, redirect to /projects
  - [x] Error message `data-testid="login-error"` on 401
  - [x] Loading state during request
  - [x] Tailwind styling: centered card
- [x] Write `frontend/src/App.tsx` with all routes
  - [x] `/` → redirect to /projects
  - [x] `/login` → LoginPage (public)
  - [x] `/projects` → ProjectsPage (protected)
  - [x] `/projects/:projectId` → ProjectDetailPage (protected)
  - [x] `/projects/:projectId/sessions/new` → NewSessionPage (protected)
  - [x] `/sessions/:sessionId` → SessionDetailPage (protected)
- [x] Write `frontend/src/main.tsx` — wrap in `QueryClientProvider` + `AuthProvider`
- [x] Verify: app compiles, login page renders at `http://localhost:3000/login`, login redirects to /projects

---

## Prompt 11 — Projects Dashboard ✅

- [x] Write `frontend/src/hooks/useProjects.ts`
  - [x] `useProjects()` — GET /projects query
  - [x] `useCreateProject()` — POST /projects mutation
  - [x] `useDeleteProject()` — DELETE /projects/{id} mutation
  - [x] `useProject(id)` — GET /projects/{id} query
  - [x] `useProjectSessions(projectId)` — GET /projects/{projectId}/sessions query
- [x] Write `frontend/src/components/Layout.tsx`
  - [x] Top nav: "Requirements Extractor" + logout button
  - [x] Renders child routes via `<Outlet />`
- [x] Write `frontend/src/pages/ProjectsPage.tsx`
  - [x] Header + "Neues Projekt" button
  - [x] Project grid/list (cards with name, description, session_count, created_at)
  - [x] Empty state: "Noch keine Projekte..." + create button
  - [x] Loading state: 3 skeleton cards with pulse animation
  - [x] Click card → navigate to `/projects/{id}`
  - [x] CreateProjectModal: name (required) + description textarea, submit creates project
  - [x] Delete flow: hover shows delete icon, click shows inline confirm
- [x] Write `frontend/src/pages/ProjectDetailPage.tsx`
  - [x] Header: project name + back button
  - [x] "Neue Extraktion" button → navigate to /sessions/new
  - [x] Session list (title or fallback, status badge, item counts)
  - [x] Each session row clickable → /sessions/{id}
  - [x] Empty state for sessions
  - [x] Loading skeletons
  - [x] Uses `GET /projects/{projectId}/sessions` endpoint
- [x] Wrap all protected pages in `<Layout>`

---

## Prompt 12 — New Extraction Form ✅

- [x] Write `frontend/src/lib/format.ts` — `formatBytes(bytes) -> string`
- [x] Write `frontend/src/hooks/useCreateSession.ts`
  - [x] `useMutation` calling POST /projects/{projectId}/sessions with FormData
  - [x] `Content-Type: multipart/form-data` header
- [x] Write `frontend/src/pages/NewSessionPage.tsx`
  - [x] Two tabs: "Text eingeben" / "Dateien hochladen"
  - [x] Text tab: textarea (min 200px), character counter (X / 500,000)
  - [x] File tab: drag-and-drop zone with dotted border
    - [x] Accept `.pdf,.docx,.txt,.md,.xlsx,.pptx`
    - [x] File chips with name, size (formatted), ✕ remove button
    - [x] Per-file error chip (red) if > 30 MB
    - [x] Total size warning banner (orange) if > 50 MB
    - [x] `data-testid="file-input"` on hidden file input
  - [x] Configuration section: optional title field, language dropdown (DE/EN, default DE)
  - [x] "Extraktion starten" button
    - [x] Disabled until valid input (text ≥ 50 chars OR ≥ 1 valid file)
  - [x] "Abbrechen" link back to project detail
  - [x] On submit: POST with FormData, navigate to /sessions/{id} on 202
  - [x] Error banner on 4xx with error.detail.message

---

## Prompt 13 — Extraction Progress & Results Layout ✅

- [x] Write `frontend/src/hooks/useSessionStatus.ts`
  - [x] Polls every 2s while status is pending|processing
  - [x] Stops polling when status is completed|failed (refetchInterval returns false)
  - [x] `enabled` parameter to prevent premature fetching
- [x] Write `frontend/src/hooks/useSession.ts`
  - [x] Fetches full session, `enabled` parameter
  - [x] `ApiSession` type with `UserStory`/`NFR`/`OpenQuestion` item arrays
- [x] Write `frontend/src/components/ExtractionProgress.tsx`
  - [x] Centered teal spinning ring
  - [x] Status message "Dokument wird analysiert…" with pulse animation
  - [x] `data-testid="extraction-progress"`
- [x] Write `frontend/src/components/ExtractionError.tsx`
  - [x] "Extraktion fehlgeschlagen" heading
  - [x] error_message displayed
  - [x] "Erneut versuchen" button → `navigate(-1)`
  - [x] `data-testid="extraction-error"`
- [x] Write `frontend/src/pages/SessionDetailPage.tsx` — orchestration
  - [x] Polling logic: `useSessionStatus` (enabled=true, refetchInterval stops at terminal state)
  - [x] Switch to `useSession` fetch when status = 'completed'
  - [x] Project name fetched via `useProject(session.project_id)`
  - [x] Session title fallback: "Extraktion vom {date}" when title is null
  - [x] Render ExtractionProgress / ExtractionError / results based on status
  - [x] `data-testid="session-detail"`
- [x] `frontend/src/components/SessionHeader.tsx` (already existed) used for tab bar + actions
  - [x] Tab bar: "User Stories ({count})" | "NFRs ({count})" | "Offene Fragen ({count})"
  - [x] Export + Speichern buttons in header
- [x] `frontend/src/components/UserStoryCard.tsx` (already existed, wired to real API data)
  - [x] Title, Als/möchte/damit rows, priority badge, labels
  - [x] Source snippet inset block
- [x] `frontend/src/components/NFRCard.tsx` (already existed, wired to real API data)
  - [x] Title, category badge (color-coded), metric, description, priority badge
  - [x] Source snippet inset block
- [x] `frontend/src/components/OpenQuestionCard.tsx` (already existed, wired to real API data)
  - [x] question_text, owner, status badge (open=amber, answered=green, deferred=gray)
  - [x] Source snippet inset block
- [x] Empty state per tab (icon + German message) when 0 items

---

## Prompt 14 — Inline Editing & Item Management ✅

- [x] Add local state management to `SessionDetailPage.tsx`
  - [x] `localItems` state initialized from server data on load
  - [x] Track which items have been modified (`isDirty` flag)
- [x] Update `UserStoryCard.tsx` — add edit mode
  - [x] Edit mode toggle (pencil icon) with `data-testid="edit-story-btn"`
  - [x] In edit mode: all fields become inputs/textareas
  - [x] Priority `<select>` (low/medium/high/critical)
  - [x] Labels: tag input (✕ to remove, Enter to add)
  - [x] Acceptance criteria: textarea per item + "Add criterion" button
  - [x] Cancel button restores original values
  - [x] Escape key cancels editing
  - [x] `onUpdate(id, changes)` callback prop
- [x] Update `NFRCard.tsx` — add edit mode
  - [x] title, category (select), description, metric, priority all editable
  - [x] Same cancel/escape behavior
  - [x] Fixed category casing bug (API returns lowercase; normalized for display)
- [x] Update `OpenQuestionCard.tsx` — add edit mode
  - [x] question_text, owner, status (select: open/answered/deferred) editable
  - [x] Fixed `OpenQuestionUpdate` schema: was `"open"|"resolved"`, now `"open"|"answered"|"deferred"`
- [x] Add delete + undo toast logic to `SessionDetailPage.tsx`
  - [x] `handleDeleteItem(id, type)` — remove from localItems immediately (optimistic)
  - [x] Start 5s timer, call DELETE API on timeout
  - [x] `handleUndoDelete()` — cancel timer, restore item to localItems
  - [x] Pass delete handlers to cards
- [x] Write `frontend/src/components/UndoToast.tsx`
  - [x] Fixed bottom-center, "Element gelöscht. [Rückgängig]" link
  - [x] 5s countdown progress bar (CSS animation)
  - [x] `data-testid="undo-toast"`, `data-testid="undo-button"`
- [x] Add "Add item" inline forms below each tab list
  - [x] "+ User Story hinzufügen" → inline form, POST on submit
  - [x] "+ NFR hinzufügen" → inline form for NFR fields
  - [x] "+ Offene Frage hinzufügen" → inline form for question
- [x] Implement save flow
  - [x] `useUpdateItem()` hook — PATCH/DELETE/POST create for all item types
  - [x] `handleSave()` — diff `localItems` vs `serverItemsRef`, PATCH only changed fields
  - [x] Spinner on save button while saving ("Speichert…")
  - [x] "Gespeichert ✓" state for 2s after successful save
  - [x] Error banner on save failure
  - [x] Save button disabled when no changes (`isDirty=false`)
- [x] Fixed `useSession.ts`: API field `non_functional_requirements` (was incorrectly `nfrs`)
- [x] Fixed `Dockerfile`: was installing `google-generativeai` (old SDK), now `google-genai`
- [x] Fixed `gemini_client.py`: model updated from `gemini-1.5-pro` → `gemini-2.0-flash`

---

## Prompt 15 — Export UI & Clipboard

- [ ] Write `frontend/src/lib/clipboard.ts`
  - [ ] `copyToClipboard(text)` — navigator.clipboard with legacy fallback
- [ ] Write `frontend/src/hooks/useExport.ts`
  - [ ] `downloadExport(format)` — GET /sessions/{id}/export as blob, trigger download
- [ ] Write `frontend/src/lib/markdown.ts`
  - [ ] `generateMarkdownClientSide(session, localItems) -> string` — same format as backend exporter
- [ ] Write `frontend/src/components/ExportMenu.tsx`
  - [ ] "Exportieren ▾" dropdown button in SessionResults header
  - [ ] "📋 Alle kopieren (Markdown)" → copyToClipboard(markdownText)
  - [ ] "⬇ Markdown herunterladen" → downloadExport('markdown')
  - [ ] "⬇ JSON herunterladen" → downloadExport('json')
- [ ] Add per-item copy button to all card components
  - [ ] Copy icon visible on hover
  - [ ] "✓ Kopiert!" tooltip for 2 seconds after click
  - [ ] UserStory format: Als/möchte/damit 3 lines
  - [ ] NFR format: [category] title: metric
  - [ ] OpenQuestion format: ❓ question_text
- [ ] Wire ExportMenu into SessionResults header (replace placeholder)

---

## Prompt 16 — Error Handling & Empty States

- [ ] Backend: add exception handlers to `backend/app/main.py`
  - [ ] `RequestValidationError` → 422 with `VALIDATION_ERROR` code
  - [ ] Generic `Exception` → 500 with `INTERNAL_ERROR`, log the error
- [ ] Write `frontend/src/lib/api.ts` additions
  - [ ] `ApiError` interface (error: string, message: string)
  - [ ] `getApiErrorMessage(err) -> string` utility
- [ ] Write `frontend/src/components/ErrorBanner.tsx`
  - [ ] Red banner with message, optional retry button, dismiss ✕ button
  - [ ] `role="alert"` for accessibility
- [ ] Apply error handling to all pages
  - [ ] ProjectsPage: ErrorBanner on load failure with retry; inline error in create modal
  - [ ] NewSessionPage: map `FILE_TOO_LARGE`, `TOTAL_SIZE_EXCEEDED`, `INVALID_FILE_TYPE` to friendly messages; ErrorBanner on submit failure
  - [ ] SessionDetailPage: partial warning banner (yellow) when some files failed
  - [ ] SessionDetailPage: ErrorBanner on save failure
- [ ] Add empty states to all lists
  - [ ] Projects list: "Noch keine Projekte. Erstelle dein erstes Projekt." + "+" button
  - [ ] Sessions list: "Noch keine Extraktionen. Starte eine neue Extraktion." + button
  - [ ] User Stories tab (0 items): "Keine User Stories extrahiert."
  - [ ] NFRs tab (0 items): "Keine nicht-funktionalen Anforderungen gefunden."
  - [ ] Open Questions tab (0 items): "Keine offenen Fragen identifiziert."
- [ ] Write `frontend/src/components/Skeleton.tsx`
  - [ ] `<Skeleton className />` — animated pulse box
  - [ ] `<CardSkeleton />` — card-shaped skeleton
- [ ] Apply skeletons to loading states
  - [ ] ProjectsPage: 3 skeleton cards while loading
  - [ ] ProjectDetailPage: skeleton rows while loading sessions
  - [ ] SessionDetailPage: skeletons while session loads after polling completes

---

## Prompt 17 — E2E Tests (Happy Path)

- [ ] Set up Playwright
  - [ ] Add `@playwright/test` to frontend devDependencies
  - [ ] Add `e2e` and `e2e:ui` scripts to package.json
  - [ ] Write `frontend/playwright.config.ts` (baseURL, screenshots on failure, webServer config)
  - [ ] Create `frontend/e2e/tests/` directory
- [ ] Write `frontend/e2e/fixtures.ts`
  - [ ] `authenticatedPage` fixture (pre-logged-in Page)
  - [ ] `testProject` fixture (creates project via API, cleans up after)
  - [ ] Use `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` env vars
- [ ] Write `frontend/e2e/tests/auth.spec.ts`
  - [ ] `login with valid credentials` → redirects to /projects
  - [ ] `login with wrong password shows error` → `data-testid="login-error"` visible
  - [ ] `protected page redirects unauthenticated user` → redirects to /login
- [ ] Write `frontend/e2e/tests/projects.spec.ts`
  - [ ] `create and delete a project` — create via modal, verify visible, delete with confirm, verify gone
- [ ] Write `frontend/e2e/tests/extraction.spec.ts`
  - [ ] `full extraction flow with text input` — enter text, submit, wait ≤45s for "User Stories" tab, verify tab count > 0
  - [ ] `edit a user story and save` — click edit, change title, save, verify "Gespeichert" and new title visible
- [ ] Add `data-testid` attributes to all components referenced in E2E tests
  - [ ] Verify `[data-testid="login-error"]`, `[data-testid="user-story-card"]`, `[data-testid="edit-story-btn"]`, `[data-testid="tab-user-stories"]`, etc. are present

---

## Prompt 18 — E2E Error Flows, Accessibility & README

- [ ] Add error-flow tests to `frontend/e2e/tests/extraction.spec.ts`
  - [ ] `shows error for oversized file` — set 31MB fake file, verify error chip visible, submit button disabled
  - [ ] `delete item and undo within 5 seconds` — delete first story, verify undo toast, click "Rückgängig", verify item restored
  - [ ] `manually add a user story` — fill inline form, click "Hinzufügen", verify story appears
- [ ] Accessibility audit and fixes
  - [ ] All form fields have associated `<label>` elements (htmlFor/id)
  - [ ] All icon buttons have `aria-label` attributes (delete, copy, edit, export)
  - [ ] No focus traps outside modals
  - [ ] Error banners use `role="alert"`
  - [ ] Verify keyboard navigation works throughout (tab order)
  - [ ] Check color contrast for primary colors (≥ 4.5:1 ratio)
- [ ] Write `README.md`
  - [ ] Prerequisites (Docker, Docker Compose, Google AI API key)
  - [ ] Quick start (clone → .env → docker compose up → create user → open app)
  - [ ] Create first user command: `docker compose exec backend python -m scripts.create_user --email ... --password ...`
  - [ ] Development setup (run backend/frontend locally without Docker)
  - [ ] Running unit/integration tests: `pytest`
  - [ ] Running E2E tests: `npm run e2e`

---

## Final Verification Checklist

- [ ] All backend unit tests pass (`pytest backend/tests/`)
- [ ] All backend integration tests pass
- [ ] Frontend builds without TypeScript errors (`npm run build`)
- [ ] All Playwright E2E tests pass (happy path + error flows)
- [ ] `docker compose up --build` starts cleanly from scratch
- [ ] Full extraction flow works end-to-end with real Gemini API key
- [ ] Export downloads produce valid Markdown and JSON files
- [ ] App is accessible via keyboard navigation
