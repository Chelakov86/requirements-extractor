# Requirements Extractor Agent — Developer-Ready Specification

**Version**: 1.0
**Date**: 2026-02-19
**Status**: Draft

---

## 1. Project Overview

### Problem Statement

Business Analysts and Product Managers regularly receive requirements in unstructured formats — customer emails, meeting transcripts, briefing documents, and presentations. Manually translating this content into structured User Stories, Non-Functional Requirements, and open questions is time-consuming, error-prone, and inconsistent across team members.

### Goal

Build an internal web tool that uses AI (Google Gemini) to automatically extract structured requirements from unstructured documents and text, presenting them in an editable preview before saving — with a data model designed for future Jira/Confluence integration.

### Success Criteria

- A BA/PM can upload a document or paste text and receive structured, editable requirements within 30 seconds
- Extracted items are traceable back to their source text
- The output is ready for Jira import with minimal manual rework
- The tool handles German and English input/output

---

## 2. User Stories & Use Cases

### Primary Users
Internal Business Analysts (BAs) and Product Managers (PMs)

### Core User Stories

| ID | User Story |
|----|-----------|
| US-01 | Als BA möchte ich Text oder Dokumente hochladen, damit ich daraus automatisch User Stories extrahieren kann. |
| US-02 | Als BA möchte ich extrahierte User Stories bearbeiten, löschen oder manuell ergänzen, damit das Ergebnis korrekt ist. |
| US-03 | Als PM möchte ich erkannte NFRs mit Kategorie und Metrik sehen, damit ich nicht-funktionale Anforderungen nicht übersehe. |
| US-04 | Als BA möchte ich offene Fragen aus dem Dokument identifiziert bekommen, damit ich gezielt Klärungsbedarf nachverfolgen kann. |
| US-05 | Als BA möchte ich sehen aus welchem Textabschnitt ein Item stammt, damit ich die Extraktion verifizieren kann. |
| US-06 | Als PM möchte ich mehrere Dokumente einem Projekt zuordnen, damit alle Anforderungen gesammelt bleiben. |
| US-07 | Als BA möchte ich die Ausgabesprache (Deutsch/Englisch) konfigurieren, damit das Ergebnis zur Projektsprache passt. |
| US-08 | Als Nutzer möchte ich mich einloggen, damit meine Projekte und Extraktionen gespeichert bleiben. |

---

## 3. Functional Requirements

### 3.1 Authentication

- Simple email/password login
- Session-based authentication (JWT)
- No role management required in v1

### 3.2 Project Management

| # | Requirement | Acceptance Criteria |
|---|-------------|---------------------|
| F-01 | Nutzer kann Projekte erstellen, benennen und löschen | Projekt hat Name, Beschreibung (optional), Erstellungsdatum |
| F-02 | Jedes Projekt enthält eine Liste von Extraktions-Sessions | Sessions sind einem Projekt zugeordnet und chronologisch sortiert |
| F-03 | Nutzer kann zwischen Projekten navigieren | Projekte-Übersicht als Dashboard |

### 3.3 Input

| # | Requirement | Acceptance Criteria |
|---|-------------|---------------------|
| F-04 | Text-Eingabe per Textarea | Min. 50 Zeichen, max. 500.000 Zeichen |
| F-05 | Datei-Upload: PDF, DOCX, TXT, MD, XLSX, PPTX | Max. 30 MB pro Datei |
| F-06 | Mehrere Dateien pro Extraktion möglich | Max. 50 MB Gesamtgröße pro Extraktion |
| F-07 | Text wird aus Dateien serverseitig extrahiert | PDF: PyMuPDF; DOCX: python-docx; XLSX: openpyxl; PPTX: python-pptx; MD/TXT: direkt |
| F-08 | Konfigurierbare Ausgabesprache (DE / EN) | Dropdown-Auswahl vor Extraktion, Default: DE |

### 3.4 Extraktion

| # | Requirement | Acceptance Criteria |
|---|-------------|---------------------|
| F-09 | Extraktion von User Stories im Format "Als... möchte ich... damit..." | Jede Story klar abgegrenzt |
| F-10 | Extraktion von NFRs mit Kategorie und Metrik | Kategorien: Performance, Security, Usability, Reliability, Maintainability, Compliance |
| F-11 | Extraktion offener Fragen | Als eigenständiger Typ mit Status |
| F-12 | Quellenangabe pro Item als Originaltext-Snippet | Max. 500 Zeichen des Originaltexts |
| F-13 | Progress-Indikator während Extraktion | Spinner + Statusmeldung ("Dokument wird analysiert...") |

### 3.5 Vorschau & Bearbeitung

| # | Requirement | Acceptance Criteria |
|---|-------------|---------------------|
| F-14 | Ergebnisse werden als bearbeitbare Liste angezeigt | Inline-Edit für alle Felder |
| F-15 | Nutzer kann Items löschen | Soft-Delete mit Undo-Option (5 Sekunden) |
| F-16 | Nutzer kann Items manuell hinzufügen | Formular für alle drei Typen |
| F-17 | Nutzer kann Items speichern | Speichern-Button, Bestätigung |
| F-18 | Originaltext-Snippet ist sichtbar/aufklappbar pro Item | Collapsed by default, expandierbar |

### 3.6 Export (v1)

- Copy-to-Clipboard für einzelne Items und alle Items
- Export als Markdown und JSON
- *(Jira/Confluence-Push: Phase 2)*

---

## 4. Non-Functional Requirements

| Kategorie | Anforderung | Zielwert |
|-----------|-------------|----------|
| Performance | Extraktionsdauer für normale Dokumente (< 5 MB) | < 30 Sekunden |
| Performance | Max. Dateigröße pro Datei | 30 MB |
| Performance | Max. Gesamtgröße pro Extraktion | 50 MB |
| Performance | Max. Textlänge | ~50.000 Tokens |
| Usability | Fehlermeldungen sind handlungsleitend | Immer mit Handlungsempfehlung |
| Maintainability | Datenmodell Jira-kompatibel | Felder gemappt auf Jira Issue-Felder |
| Availability | Lokales Deployment, kein SLA | Best-effort |
| Accessibility | WCAG 2.1 AA Basiskonformität | Keyboard-navigierbar, ausreichend Kontrast |

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Auth    │  │ Projects │  │  Extraction View   │ │
│  │  Login   │  │Dashboard │  │  Preview + Edit    │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└────────────────────────┬────────────────────────────┘
                         │ REST API (HTTPS)
┌────────────────────────▼────────────────────────────┐
│                FastAPI Backend (Python)              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth    │  │  File Parser │  │ Extraction    │  │
│  │  Service │  │  Service     │  │ Service       │  │
│  └──────────┘  └──────────────┘  └───────┬───────┘  │
│                                          │           │
│  ┌───────────────────────────────────────▼───────┐  │
│  │              Google Gemini API                │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              PostgreSQL Database              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript | Robuste UI für Editierung, Tabellenansichten |
| Styling | Tailwind CSS | Schnelle Entwicklung, konsistentes Design |
| Backend | Python 3.12 + FastAPI | Optimal für KI-Integration, async support |
| AI | Google Gemini 1.5 Pro | Großes Context Window (1M tokens), Multilingual |
| Database | PostgreSQL 16 | Strukturierte Daten, Relations, JSON-Felder |
| ORM | SQLAlchemy + Alembic | Migrations-Management |
| File Parsing | PyMuPDF, python-docx, openpyxl, python-pptx | Bewährte Libraries |
| Auth | JWT (python-jose) | Stateless, einfach |
| Deployment | Docker Compose | Lokales Setup, einfach portierbar |

---

## 6. Data Model

### Entity Relationship Diagram

```
User
 └── has many ──> Project
                   └── has many ──> ExtractionSession
                                     ├── has many ──> UserStory
                                     ├── has many ──> NonFunctionalRequirement
                                     ├── has many ──> OpenQuestion
                                     └── has many ──> SourceDocument
```

### Tables

#### `users`
```sql
id            UUID PRIMARY KEY
email         VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
created_at    TIMESTAMP DEFAULT NOW()
```

#### `projects`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
name        VARCHAR(255) NOT NULL
description TEXT
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP
```

#### `extraction_sessions`
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES projects(id) ON DELETE CASCADE
title           VARCHAR(255)
output_language VARCHAR(2) DEFAULT 'de'  -- 'de' | 'en'
status          VARCHAR(20) DEFAULT 'pending'  -- pending | processing | completed | failed
created_at      TIMESTAMP DEFAULT NOW()
```

#### `source_documents`
```sql
id              UUID PRIMARY KEY
session_id      UUID REFERENCES extraction_sessions(id) ON DELETE CASCADE
filename        VARCHAR(255)
file_type       VARCHAR(10)  -- pdf | docx | txt | md | xlsx | pptx | text
raw_text        TEXT         -- extracted plain text
created_at      TIMESTAMP DEFAULT NOW()
```

#### `user_stories`
```sql
id              UUID PRIMARY KEY
session_id      UUID REFERENCES extraction_sessions(id) ON DELETE CASCADE
title           VARCHAR(500) NOT NULL
as_who          TEXT NOT NULL     -- "Als [Rolle]"
i_want          TEXT NOT NULL     -- "möchte ich [Aktion]"
so_that         TEXT NOT NULL     -- "damit [Nutzen]"
acceptance_criteria  TEXT[]       -- Array of criteria strings
priority        VARCHAR(10) DEFAULT 'medium'  -- low | medium | high | critical
labels          TEXT[]
source_snippet  TEXT             -- Original text excerpt
is_deleted      BOOLEAN DEFAULT FALSE
sort_order      INTEGER
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP
```

#### `non_functional_requirements`
```sql
id              UUID PRIMARY KEY
session_id      UUID REFERENCES extraction_sessions(id) ON DELETE CASCADE
title           VARCHAR(500) NOT NULL
category        VARCHAR(50) NOT NULL   -- performance | security | usability | reliability | maintainability | compliance
description     TEXT
metric          VARCHAR(500)           -- z.B. "Ladezeit < 2s"
priority        VARCHAR(10) DEFAULT 'medium'
source_snippet  TEXT
is_deleted      BOOLEAN DEFAULT FALSE
sort_order      INTEGER
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP
```

#### `open_questions`
```sql
id              UUID PRIMARY KEY
session_id      UUID REFERENCES extraction_sessions(id) ON DELETE CASCADE
question_text   TEXT NOT NULL
owner           VARCHAR(255)            -- optional responsible person
status          VARCHAR(20) DEFAULT 'open'   -- open | resolved
source_snippet  TEXT
is_deleted      BOOLEAN DEFAULT FALSE
sort_order      INTEGER
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP
```

---

## 7. API Contracts

### Base URL
`http://localhost:8000/api/v1`

### Authentication
All endpoints (except `/auth/*`) require `Authorization: Bearer <jwt_token>` header.

---

### Auth

#### `POST /auth/login`
```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 86400 }

// Response 401
{ "error": "INVALID_CREDENTIALS", "message": "Email oder Passwort falsch." }
```

---

### Projects

#### `GET /projects`
```json
// Response 200
[
  {
    "id": "uuid",
    "name": "Projekt Alpha",
    "description": "...",
    "session_count": 3,
    "created_at": "2026-02-19T10:00:00Z"
  }
]
```

#### `POST /projects`
```json
// Request
{ "name": "Projekt Alpha", "description": "Optional" }

// Response 201
{ "id": "uuid", "name": "Projekt Alpha", ... }
```

#### `DELETE /projects/{id}`
```
// Response 204 No Content
```

---

### Extraction Sessions

#### `POST /projects/{project_id}/sessions`
```
Content-Type: multipart/form-data

Fields:
  - text_input: string (optional, min 50 chars if no files)
  - files: File[] (optional, max 30 MB each)
  - output_language: "de" | "en" (default: "de")
  - title: string (optional)

// Response 202 Accepted
{
  "session_id": "uuid",
  "status": "processing"
}
```

#### `GET /sessions/{session_id}`
```json
// Response 200
{
  "id": "uuid",
  "status": "completed",
  "output_language": "de",
  "user_stories": [...],
  "non_functional_requirements": [...],
  "open_questions": [...],
  "created_at": "..."
}
```

#### `GET /sessions/{session_id}/status`
```json
// Polling endpoint
{ "status": "processing", "progress_message": "Dokument wird analysiert..." }
```

---

### Items (User Stories / NFRs / Open Questions)

#### `PATCH /sessions/{session_id}/user-stories/{id}`
```json
// Request (all fields optional)
{
  "title": "...",
  "as_who": "...",
  "i_want": "...",
  "so_that": "...",
  "acceptance_criteria": ["..."],
  "priority": "high",
  "labels": ["frontend"]
}
// Response 200 — updated object
```

#### `DELETE /sessions/{session_id}/user-stories/{id}`
```
// Response 204 (soft delete: is_deleted = true)
```

#### `POST /sessions/{session_id}/user-stories`
```json
// Manually add item
{ "title": "...", "as_who": "...", "i_want": "...", "so_that": "..." }
// Response 201
```

*Analogous endpoints for `/non-functional-requirements` and `/open-questions`.*

---

### Export

#### `GET /sessions/{session_id}/export?format=markdown|json`
```
// Response 200 with appropriate Content-Type
```

---

## 8. Error Handling Strategy

### Error Categories

| Code | Scenario | User-Facing Message | HTTP Status |
|------|----------|---------------------|-------------|
| `INVALID_FILE_TYPE` | Unsupported format | "Dateiformat nicht unterstützt. Bitte PDF, DOCX, TXT, MD, XLSX oder PPTX verwenden." | 400 |
| `FILE_TOO_LARGE` | > 30 MB pro Datei | "Die Datei '{name}' überschreitet das Maximum von 30 MB." | 400 |
| `TOTAL_SIZE_EXCEEDED` | > 50 MB gesamt | "Die Gesamtgröße aller Dateien überschreitet 50 MB." | 400 |
| `NO_TEXT_EXTRACTED` | Bild-only PDF, leeres Dokument | "Aus '{name}' konnte kein Text gelesen werden. Bitte ein PDF mit selektierbarem Text verwenden." | 422 |
| `INSUFFICIENT_CONTENT` | Wenig/kein Anforderungstext | "Nur {n} Items gefunden. Das Dokument enthält möglicherweise wenige Anforderungen." | 200 + warning |
| `AI_SERVICE_ERROR` | Gemini API nicht erreichbar | "KI-Dienst vorübergehend nicht verfügbar. Bitte in einigen Minuten erneut versuchen." | 503 |
| `TEXT_TOO_LONG` | > 50.000 Tokens | "Das Dokument ist zu lang. Bitte aufteilen (max. ~38.000 Wörter)." | 400 |
| `EXTRACTION_TIMEOUT` | > 120s | "Die Verarbeitung hat zu lange gedauert. Bitte kleinere Dokumente versuchen." | 504 |

### Behavior Rules

- **Nie stilles Scheitern**: Jeder Fehler erzeugt eine sichtbare, erklärende Meldung
- **Teilergebnisse zeigen**: Wenn einzelne Dateien einer Multi-File-Extraktion scheitern, werden Ergebnisse der anderen Dateien trotzdem angezeigt + Warnung
- **Retry-Hinweis**: Bei transienten Fehlern (AI_SERVICE_ERROR, TIMEOUT) immer Retry-Button anzeigen

---

## 9. Security & Permissions

### Authentication
- Passwords: bcrypt hashing (min. cost factor 12)
- JWT: HS256, 24h Expiry, Secret in `.env`
- No refresh tokens in v1 (acceptable for internal tool)

### Input Validation
- File upload: MIME-Type-Check + Extension-Check (beide müssen übereinstimmen)
- File content: Scanning auf maximale Textgröße nach Extraktion
- Text input: Länge begrenzt auf 500.000 Zeichen, HTML-Escaping im Frontend
- SQL Injection: Verhindert durch SQLAlchemy ORM (keine raw queries)

### Data Privacy
- Dokumente werden als plain text in der Datenbank gespeichert (kein Binary-Storage in v1)
- Originaldateien werden nach Textextraktion nicht persistiert (only in-memory processing)
- Kein Logging von Dokumentinhalten (nur Metadaten: Dateiname, Größe, Zeitstempel)

### Authorization
- Jeder Nutzer sieht nur seine eigenen Projekte (User-ID-Check auf allen Queries)
- Keine Admin-Rolle in v1

---

## 10. Testing Plan

### Unit Tests (pytest)

| Component | Test Cases |
|-----------|-----------|
| File Parser Service | PDF mit Text, PDF ohne Text (Bild-only), DOCX, XLSX, PPTX, TXT >30MB |
| Gemini Prompt Builder | Deutsche Ausgabe, englische Ausgabe, leerer Input |
| Response Parser | Valides JSON von Gemini, invalides JSON, leeres Ergebnis |
| Auth Service | Login success, wrong password, expired token |

### Integration Tests

| Scenario | Expected Outcome |
|----------|-----------------|
| Upload PDF + Textinput kombiniert | Beide Quellen extrahiert, Sessions korrekt zusammengefasst |
| Extraktion mit DE/EN-Umschaltung | Output-Sprache entspricht Konfiguration |
| PATCH User Story | Felder korrekt aktualisiert in DB |
| DELETE + Undo | is_deleted=true, nach Undo wieder false |
| Export Markdown | Vollständiges, valides Markdown-Dokument |

### E2E Tests (Playwright)

| Flow | Steps |
|------|-------|
| Happy Path | Login → Projekt erstellen → Datei uploaden → Extraktion starten → Ergebnis bearbeiten → Speichern |
| Fehlerfall | Bild-PDF uploaden → Fehlermeldung sichtbar → Retry funktioniert |
| Manuell hinzufügen | User Story manuell erstellen → In Vorschau erscheint → Speicherbar |

### Coverage Target
- Unit Tests: ≥ 80% der Service-Layer
- Integration Tests: Alle API-Endpoints abgedeckt
- E2E: Alle Core User Stories (US-01 bis US-08)

---

## 11. Open Questions & Risks

### Assumptions Made

| # | Assumption |
|---|-----------|
| A-01 | Nutzer haben einen Google AI API Key (Gemini 1.5 Pro Zugang) |
| A-02 | Lokales Deployment bedeutet Docker Compose auf Entwickler-Maschine |
| A-03 | Kein Multi-Tenancy erforderlich — ein lokaler Nutzer reicht für v1 |
| A-04 | Originaldateien müssen nicht persistent gespeichert werden |
| A-05 | Ausgabesprache ist pro Extraktion konfigurierbar, nicht pro Nutzer-Profil |

### Open Questions

| # | Frage | Impact |
|---|-------|--------|
| OQ-01 | Wie viele Nutzer werden gleichzeitig das Tool verwenden? (Skalierung für späteres Cloud-Deployment) | Mittel |
| OQ-02 | Sollen Projekte zwischen Nutzern geteilt werden können? (aktuell: nein) | Hoch (bei Änderung) |
| OQ-03 | Welches Gemini-Modell genau: 1.5 Pro oder 2.0 Flash? (Kosten vs. Qualität) | Niedrig |
| OQ-04 | Sollen Extraktions-Sessions versioniert werden? (Vor/Nach-Edit vergleichen) | Mittel |

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Gemini extrahiert fehlerhafte User Stories | Mittel | Inline-Editing als Fallback; Prompt-Engineering iterieren |
| Sehr große PPT/XLSX lösen Timeout aus | Mittel | Chunking-Strategie für große Dokumente implementieren |
| Jira-Integration erfordert komplexes Daten-Re-Mapping | Niedrig | Datenmodell jetzt schon an Jira-Feldern ausrichten |

---

## 12. Implementation Roadmap

### Phase 1 — Foundation (Sprint 1–2)
- [ ] Docker Compose Setup (FastAPI + PostgreSQL + React)
- [ ] Datenbankschema + Alembic Migrations
- [ ] JWT Authentication (Login/Logout)
- [ ] Projekt-CRUD API + Frontend
- [ ] Text-Parsing für alle Dateiformate

### Phase 2 — Core Extraction (Sprint 3–4)
- [ ] Gemini API Integration + Prompt Engineering
- [ ] Extraktion von User Stories, NFRs, Offenen Fragen
- [ ] Quellenangabe / Source Snippet Mapping
- [ ] Mehrsprachigkeit (DE/EN Output)
- [ ] Progress-Indikator (Polling)

### Phase 3 — Preview & Editing (Sprint 5)
- [ ] Extraktions-Vorschau UI
- [ ] Inline-Edit für alle Felder
- [ ] Manuelles Hinzufügen / Löschen + Undo
- [ ] Speichern in Datenbank

### Phase 4 — Polish & Export (Sprint 6)
- [ ] Markdown + JSON Export
- [ ] Error Handling (alle Fehlerfälle laut Spec)
- [ ] Unit + Integration + E2E Tests
- [ ] UX-Review + Accessibility

### Phase 5 — Jira/Confluence Integration (Future)
- [ ] OAuth 2.0 Jira App Setup
- [ ] User Story → Jira Issue Export
- [ ] NFRs + Open Questions → Confluence Page Export

---

*Specification compiled from discovery interview on 2026-02-19.*
