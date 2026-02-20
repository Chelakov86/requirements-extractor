import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.utils import hash_password
from app.models import User


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


def test_list_projects_empty(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    response = client.get("/api/v1/projects", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_create_project(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    response = client.post("/api/v1/projects", json={"name": "My Project"}, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert body["name"] == "My Project"
    assert body["session_count"] == 0


def test_create_project_missing_name(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    response = client.post("/api/v1/projects", json={"name": ""}, headers=headers)
    assert response.status_code == 422


def test_list_projects_returns_created(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    client.post("/api/v1/projects", json={"name": "Project A"}, headers=headers)
    client.post("/api/v1/projects", json={"name": "Project B"}, headers=headers)
    response = client.get("/api/v1/projects", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_project_by_id(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/projects", json={"name": "Test Project"}, headers=headers
    ).json()
    response = client.get(f"/api/v1/projects/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]
    assert response.json()["name"] == "Test Project"


def test_get_project_not_found(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    response = client.get(
        "/api/v1/projects/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert response.status_code == 404


def test_delete_project(client: TestClient, test_user: User) -> None:
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/projects", json={"name": "To Delete"}, headers=headers
    ).json()
    delete_response = client.delete(f"/api/v1/projects/{created['id']}", headers=headers)
    assert delete_response.status_code == 204
    get_response = client.get(f"/api/v1/projects/{created['id']}", headers=headers)
    assert get_response.status_code == 404


def test_user_isolation(client: TestClient, test_user: User, db_session: Session) -> None:
    # User A creates a project
    headers_a = auth_headers(client)
    created = client.post(
        "/api/v1/projects", json={"name": "User A Project"}, headers=headers_a
    ).json()

    # Create user B directly in DB
    user_b = User(email="userb@example.com", password_hash=hash_password("secret456"))
    db_session.add(user_b)
    db_session.commit()

    headers_b = auth_headers(client, email="userb@example.com", password="secret456")

    # User B sees an empty list
    list_response = client.get("/api/v1/projects", headers=headers_b)
    assert list_response.status_code == 200
    assert list_response.json() == []

    # User B cannot access user A's project by ID
    get_response = client.get(f"/api/v1/projects/{created['id']}", headers=headers_b)
    assert get_response.status_code == 404
