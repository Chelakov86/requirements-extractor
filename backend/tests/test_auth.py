import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.utils import create_access_token, hash_password
from app.models import User


@pytest.fixture
def test_user(db_session: Session) -> User:
    user = User(email="test@example.com", password_hash=hash_password("secret123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_success(client: TestClient, test_user: User) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 86400


def test_login_wrong_password(client: TestClient, test_user: User) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error"] == "INVALID_CREDENTIALS"


def test_login_unknown_email(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "whatever"},
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error"] == "INVALID_CREDENTIALS"


def test_protected_endpoint_without_token(client: TestClient) -> None:
    response = client.get("/api/v1/projects")
    assert response.status_code == 401


def test_protected_endpoint_with_token(client: TestClient, test_user: User) -> None:
    token = create_access_token(str(test_user.id))
    response = client.get(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json() == []
