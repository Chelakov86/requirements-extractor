import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.utils import hash_password
from app.models import ExtractionSession, NonFunctionalRequirement, OpenQuestion, Project, User, UserStory


# ---------------------------------------------------------------------------
# Fixtures and helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def test_user(db_session: Session) -> User:
    user = User(email="user@example.com", password_hash=hash_password("secret123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(
    client: TestClient, email: str = "user@example.com", password: str = "secret123"
) -> dict:
    response = client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_project(client: TestClient, headers: dict) -> dict:
    resp = client.post("/api/v1/projects", json={"name": "Test Project"}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def create_session_with_items(
    client: TestClient,
    db_session: Session,
    headers: dict,
    project_id: str,
) -> tuple[str, UserStory, NonFunctionalRequirement, OpenQuestion]:
    """Create an extraction session via the API, then insert mock items directly into the DB."""
    resp = client.post(
        f"/api/v1/projects/{project_id}/sessions",
        data={"text_input": "A" * 100, "output_language": "en"},
        headers=headers,
    )
    assert resp.status_code == 202
    session_id = resp.json()["session_id"]

    us = UserStory(
        session_id=uuid.UUID(session_id),
        title="Original Title",
        as_who="a user",
        i_want="to test things",
        so_that="I can verify",
        acceptance_criteria=["criterion one"],
        priority="medium",
        labels=["backend"],
        sort_order=0,
    )
    nfr = NonFunctionalRequirement(
        session_id=uuid.UUID(session_id),
        title="Original NFR",
        category="performance",
        description="Must be fast",
        priority="high",
        sort_order=0,
    )
    oq = OpenQuestion(
        session_id=uuid.UUID(session_id),
        question_text="Original question?",
        owner="alice",
        sort_order=0,
    )
    db_session.add_all([us, nfr, oq])
    db_session.commit()
    db_session.refresh(us)
    db_session.refresh(nfr)
    db_session.refresh(oq)

    return session_id, us, nfr, oq


# ---------------------------------------------------------------------------
# User Story tests
# ---------------------------------------------------------------------------


def test_patch_user_story(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, us, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    resp = client.patch(
        f"/api/v1/sessions/{session_id}/user-stories/{us.id}",
        json={"title": "Updated Title", "priority": "high"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated Title"
    assert body["priority"] == "high"
    assert body["updated_at"] is not None


def test_patch_partial(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, us, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    resp = client.patch(
        f"/api/v1/sessions/{session_id}/user-stories/{us.id}",
        json={"title": "Only Title Changed"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Only Title Changed"
    # Other fields remain unchanged
    assert body["as_who"] == "a user"
    assert body["i_want"] == "to test things"
    assert body["priority"] == "medium"


def test_patch_not_found(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = client.patch(
        f"/api/v1/sessions/{session_id}/user-stories/{fake_id}",
        json={"title": "Nope"},
        headers=headers,
    )
    assert resp.status_code == 404


def test_delete_user_story_soft(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, us, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    del_resp = client.delete(
        f"/api/v1/sessions/{session_id}/user-stories/{us.id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    # GET session should not include the deleted story
    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    assert detail_resp.status_code == 200
    ids = [s["id"] for s in detail_resp.json()["user_stories"]]
    assert str(us.id) not in ids


def test_restore_user_story(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, us, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    # Soft delete
    client.delete(
        f"/api/v1/sessions/{session_id}/user-stories/{us.id}",
        headers=headers,
    )

    # Restore
    restore_resp = client.post(
        f"/api/v1/sessions/{session_id}/user-stories/{us.id}/restore",
        headers=headers,
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["id"] == str(us.id)

    # Now it should appear in GET session again
    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [s["id"] for s in detail_resp.json()["user_stories"]]
    assert str(us.id) in ids


def test_add_user_story(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    payload = {
        "title": "New Story",
        "as_who": "a developer",
        "i_want": "to add stories",
        "so_that": "I can track work",
    }
    resp = client.post(
        f"/api/v1/sessions/{session_id}/user-stories",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "New Story"
    assert body["priority"] == "medium"  # default
    assert "id" in body

    # Verify it appears in GET session
    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [s["id"] for s in detail_resp.json()["user_stories"]]
    assert body["id"] in ids


def test_add_user_story_invalid(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    # Missing required fields: as_who, i_want, so_that
    resp = client.post(
        f"/api/v1/sessions/{session_id}/user-stories",
        json={"title": "Incomplete"},
        headers=headers,
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# NFR tests
# ---------------------------------------------------------------------------


def test_patch_nfr(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, nfr, _ = create_session_with_items(client, db_session, headers, project["id"])

    resp = client.patch(
        f"/api/v1/sessions/{session_id}/nfrs/{nfr.id}",
        json={"title": "Updated NFR", "category": "security"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated NFR"
    assert body["category"] == "security"
    assert body["updated_at"] is not None


def test_delete_nfr_soft(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, nfr, _ = create_session_with_items(client, db_session, headers, project["id"])

    del_resp = client.delete(
        f"/api/v1/sessions/{session_id}/nfrs/{nfr.id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [n["id"] for n in detail_resp.json()["non_functional_requirements"]]
    assert str(nfr.id) not in ids


def test_restore_nfr(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, nfr, _ = create_session_with_items(client, db_session, headers, project["id"])

    client.delete(f"/api/v1/sessions/{session_id}/nfrs/{nfr.id}", headers=headers)

    restore_resp = client.post(
        f"/api/v1/sessions/{session_id}/nfrs/{nfr.id}/restore",
        headers=headers,
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["id"] == str(nfr.id)


def test_add_nfr(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    payload = {"title": "New NFR", "category": "reliability"}
    resp = client.post(
        f"/api/v1/sessions/{session_id}/nfrs",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "New NFR"
    assert body["category"] == "reliability"
    assert body["priority"] == "medium"

    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [n["id"] for n in detail_resp.json()["non_functional_requirements"]]
    assert body["id"] in ids


# ---------------------------------------------------------------------------
# Open Question tests
# ---------------------------------------------------------------------------


def test_patch_open_question(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, oq = create_session_with_items(client, db_session, headers, project["id"])

    resp = client.patch(
        f"/api/v1/sessions/{session_id}/questions/{oq.id}",
        json={"question_text": "Updated question?", "status": "resolved"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["question_text"] == "Updated question?"
    assert body["status"] == "resolved"
    assert body["updated_at"] is not None


def test_delete_open_question_soft(
    client: TestClient, test_user: User, db_session: Session
) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, oq = create_session_with_items(client, db_session, headers, project["id"])

    del_resp = client.delete(
        f"/api/v1/sessions/{session_id}/questions/{oq.id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [q["id"] for q in detail_resp.json()["open_questions"]]
    assert str(oq.id) not in ids


def test_restore_open_question(
    client: TestClient, test_user: User, db_session: Session
) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, oq = create_session_with_items(client, db_session, headers, project["id"])

    client.delete(f"/api/v1/sessions/{session_id}/questions/{oq.id}", headers=headers)

    restore_resp = client.post(
        f"/api/v1/sessions/{session_id}/questions/{oq.id}/restore",
        headers=headers,
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["id"] == str(oq.id)


def test_add_open_question(client: TestClient, test_user: User, db_session: Session) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)
    session_id, _, _, _ = create_session_with_items(client, db_session, headers, project["id"])

    payload = {"question_text": "New question?", "owner": "bob"}
    resp = client.post(
        f"/api/v1/sessions/{session_id}/questions",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["question_text"] == "New question?"
    assert body["owner"] == "bob"
    assert body["status"] == "open"  # default

    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    ids = [q["id"] for q in detail_resp.json()["open_questions"]]
    assert body["id"] in ids
