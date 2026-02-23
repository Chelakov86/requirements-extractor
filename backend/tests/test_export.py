import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.utils import hash_password
from app.models import (
    ExtractionSession,
    NonFunctionalRequirement,
    OpenQuestion,
    Project,
    User,
    UserStory,
)


# ---------------------------------------------------------------------------
# Fixtures and helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def test_user(db_session: Session) -> User:
    user = User(email="export_user@example.com", password_hash=hash_password("secret123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_user(db_session: Session) -> User:
    user = User(email="other_export@example.com", password_hash=hash_password("secret123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(client: TestClient, email: str, password: str = "secret123") -> dict:
    response = client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def session_with_items(
    client: TestClient, db_session: Session, test_user: User
) -> tuple[str, list]:
    """Create a project + session via API, then insert items directly."""
    headers = auth_headers(client, test_user.email)

    # Create project
    proj_resp = client.post("/api/v1/projects", json={"name": "Export Project"}, headers=headers)
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # Create session
    sess_resp = client.post(
        f"/api/v1/projects/{project_id}/sessions",
        data={"text_input": "B" * 100, "output_language": "en"},
        headers=headers,
    )
    assert sess_resp.status_code == 202
    session_id = sess_resp.json()["session_id"]

    us1 = UserStory(
        session_id=uuid.UUID(session_id),
        title="Story One",
        as_who="a user",
        i_want="to export",
        so_that="I can share",
        acceptance_criteria=["AC one", "AC two"],
        priority="high",
        labels=["export", "core"],
        source_snippet="some source text",
        sort_order=0,
    )
    us2 = UserStory(
        session_id=uuid.UUID(session_id),
        title="Story Two",
        as_who="an admin",
        i_want="to manage",
        so_that="I can control",
        priority="medium",
        sort_order=1,
    )
    us_deleted = UserStory(
        session_id=uuid.UUID(session_id),
        title="Deleted Story",
        as_who="ghost",
        i_want="to vanish",
        so_that="nobody sees me",
        priority="low",
        is_deleted=True,
        sort_order=2,
    )
    nfr1 = NonFunctionalRequirement(
        session_id=uuid.UUID(session_id),
        title="Performance NFR",
        category="performance",
        description="Must respond quickly",
        metric="< 200ms p95",
        priority="critical",
        sort_order=0,
    )
    oq1 = OpenQuestion(
        session_id=uuid.UUID(session_id),
        question_text="Who owns the data model?",
        owner="alice",
        status="open",
        sort_order=0,
    )

    db_session.add_all([us1, us2, us_deleted, nfr1, oq1])
    db_session.commit()

    return session_id, headers


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_export_json(
    client: TestClient, test_user: User, db_session: Session, session_with_items
) -> None:
    session_id, headers = session_with_items

    resp = client.get(
        f"/api/v1/sessions/{session_id}/export?format=json",
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/json"
    assert f"session_{session_id}.json" in resp.headers["content-disposition"]

    body = resp.json()
    # Deleted story must not appear
    titles = [us["title"] for us in body["user_stories"]]
    assert "Deleted Story" not in titles
    assert "Story One" in titles
    assert "Story Two" in titles
    assert len(body["non_functional_requirements"]) == 1
    assert len(body["open_questions"]) == 1


def test_export_markdown(
    client: TestClient, test_user: User, db_session: Session, session_with_items
) -> None:
    session_id, headers = session_with_items

    resp = client.get(
        f"/api/v1/sessions/{session_id}/export?format=markdown",
        headers=headers,
    )
    assert resp.status_code == 200
    assert "text/markdown" in resp.headers["content-type"]
    assert f"session_{session_id}.md" in resp.headers["content-disposition"]

    text = resp.text
    assert "## User Stories" in text
    assert "## Non-Functional Requirements" in text
    assert "## Open Questions" in text
    # Deleted story must not appear
    assert "Deleted Story" not in text
    assert "Story One" in text


def test_export_invalid_format(
    client: TestClient, test_user: User, db_session: Session, session_with_items
) -> None:
    session_id, headers = session_with_items

    resp = client.get(
        f"/api/v1/sessions/{session_id}/export?format=csv",
        headers=headers,
    )
    assert resp.status_code == 422  # FastAPI rejects Literal["json","markdown"] constraint


def test_export_unauthorized(
    client: TestClient,
    test_user: User,
    other_user: User,
    db_session: Session,
    session_with_items,
) -> None:
    session_id, _ = session_with_items
    other_headers = auth_headers(client, other_user.email)

    resp = client.get(
        f"/api/v1/sessions/{session_id}/export?format=json",
        headers=other_headers,
    )
    assert resp.status_code == 404


def test_json_structure(
    client: TestClient, test_user: User, db_session: Session, session_with_items
) -> None:
    session_id, headers = session_with_items

    resp = client.get(
        f"/api/v1/sessions/{session_id}/export?format=json",
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()

    # Top-level keys
    assert "meta" in body
    assert "user_stories" in body
    assert "non_functional_requirements" in body
    assert "open_questions" in body

    # Meta fields
    meta = body["meta"]
    assert meta["session_id"] == session_id
    assert "project_id" in meta
    assert "output_language" in meta
    assert "exported_at" in meta

    # UserStory fields
    us = body["user_stories"][0]
    for field in ("id", "title", "as_who", "i_want", "so_that", "acceptance_criteria",
                  "priority", "labels", "source_snippet", "sort_order", "created_at"):
        assert field in us

    # NFR fields
    nfr = body["non_functional_requirements"][0]
    for field in ("id", "title", "category", "description", "metric", "priority",
                  "source_snippet", "sort_order", "created_at"):
        assert field in nfr

    # OpenQuestion fields
    oq = body["open_questions"][0]
    for field in ("id", "question_text", "owner", "status", "source_snippet",
                  "sort_order", "created_at"):
        assert field in oq
