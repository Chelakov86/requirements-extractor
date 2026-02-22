import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.utils import hash_password
from app.models import User


# ---------------------------------------------------------------------------
# Helpers
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


def create_project(client: TestClient, headers: dict, name: str = "Test Project") -> dict:
    resp = client.post("/api/v1/projects", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def post_session(
    client: TestClient,
    project_id: str,
    headers: dict,
    text: str = "A" * 100,
    language: str = "de",
) -> dict:
    """Helper: create a text-only extraction session."""
    resp = client.post(
        f"/api/v1/projects/{project_id}/sessions",
        data={"text_input": text, "output_language": language},
        headers=headers,
    )
    return resp


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_create_session_text_only(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)

    resp = post_session(client, project["id"], headers)

    assert resp.status_code == 202
    body = resp.json()
    assert "session_id" in body
    assert body["status"] == "processing"


def test_create_session_status_polling(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)

    create_resp = post_session(client, project["id"], headers, text="B" * 100)
    assert create_resp.status_code == 202
    session_id = create_resp.json()["session_id"]

    status_resp = client.get(
        f"/api/v1/sessions/{session_id}/status",
        headers=headers,
    )
    assert status_resp.status_code == 200
    body = status_resp.json()
    assert "status" in body
    assert body["status"] in ("pending", "processing", "completed", "error")


def test_create_session_wrong_project(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    fake_id = "00000000-0000-0000-0000-000000000000"

    resp = post_session(client, fake_id, headers)

    assert resp.status_code == 404


def test_create_session_no_input(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)

    resp = client.post(
        f"/api/v1/projects/{project['id']}/sessions",
        data={},
        headers=headers,
    )

    assert resp.status_code == 422


def test_get_session_returns_empty_items(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)

    create_resp = post_session(client, project["id"], headers, text="C" * 100, language="en")
    assert create_resp.status_code == 202
    session_id = create_resp.json()["session_id"]

    detail_resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    assert detail_resp.status_code == 200
    body = detail_resp.json()
    assert body["user_stories"] == []
    assert body["non_functional_requirements"] == []
    assert body["open_questions"] == []
    assert body["output_language"] == "en"
    assert "id" in body


def test_session_not_accessible_by_other_user(
    client: TestClient, test_user: User, db_session: Session
) -> None:
    headers_a = auth_headers(client)
    project_a = create_project(client, headers_a, name="User A Project")

    create_resp = post_session(client, project_a["id"], headers_a, text="D" * 100)
    assert create_resp.status_code == 202
    session_id = create_resp.json()["session_id"]

    # Create a second user and authenticate as them
    user_b = User(email="userb@example.com", password_hash=hash_password("secret456"))
    db_session.add(user_b)
    db_session.commit()
    headers_b = auth_headers(client, email="userb@example.com", password="secret456")

    # User B should get 404 for user A's session
    resp = client.get(f"/api/v1/sessions/{session_id}", headers=headers_b)
    assert resp.status_code == 404

    resp_status = client.get(f"/api/v1/sessions/{session_id}/status", headers=headers_b)
    assert resp_status.status_code == 404


def test_list_sessions_for_project(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    project = create_project(client, headers)

    # Create two sessions
    post_session(client, project["id"], headers, text="E" * 100)
    post_session(client, project["id"], headers, text="F" * 100)

    resp = client.get(f"/api/v1/projects/{project['id']}/sessions", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 2
    # Verify shape of each summary
    for entry in body:
        assert "id" in entry
        assert "status" in entry
        assert "user_story_count" in entry
        assert "nfr_count" in entry
        assert "open_question_count" in entry
        assert entry["user_story_count"] == 0
        assert entry["nfr_count"] == 0
        assert entry["open_question_count"] == 0


def test_list_sessions_wrong_project(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    fake_id = "00000000-0000-0000-0000-000000000000"

    resp = client.get(f"/api/v1/projects/{fake_id}/sessions", headers=headers)
    assert resp.status_code == 404
