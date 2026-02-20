import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

from app.config import settings
from app.database import get_db
from app.main import app
from app.models import Base

# Derive test DB URL by appending _test to the database name
_url_base, _db_name = settings.DATABASE_URL.rsplit("/", 1)
TEST_DATABASE_URL = f"{_url_base}/{_db_name}_test"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_db() -> None:
    """Create the test database if it doesn't already exist."""
    admin_engine = create_engine(f"{_url_base}/postgres", isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": f"{_db_name}_test"},
        ).fetchone()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{_db_name}_test"'))
    admin_engine.dispose()


@pytest.fixture
def db_session(create_test_db: None) -> Session:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> TestClient:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
