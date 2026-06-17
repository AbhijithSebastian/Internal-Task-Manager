import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import get_db
from app.core.config import settings
from main import app

# Disable rate limiting for tests
settings.rate_limit_per_minute = 0

engine = create_engine(
    "postgresql+psycopg://taskmanager:taskmanager@postgres:5432/taskmanager",
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def _clean_test_data():
    from sqlalchemy import text
    from app.core.database import SessionLocal
    db = SessionLocal()
    db.execute(text("DELETE FROM user_roles"))
    db.execute(text("DELETE FROM users WHERE email IN ('abhijith@tool.com', 'test_employee@example.com')"))
    db.commit()
    db.close()


@pytest.fixture
def admin_token(client, _clean_test_data):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "abhijith@tool.com", "password": "password"},
    )
    if resp.status_code != 200:
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Super Admin",
                "email": "abhijith@tool.com",
                "password": "password",
                "password_confirmation": "password",
            },
        )
    assert resp.status_code == 200, f"Admin setup failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def admin_auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def employee_token(client, _clean_test_data):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test_employee@example.com", "password": "Test123!"},
    )
    if resp.status_code == 200:
        return resp.json()["access_token"]
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Employee",
            "email": "test_employee@example.com",
            "password": "Test123!",
            "password_confirmation": "Test123!",
            "job_title": "Tester",
        },
    )
    assert resp.status_code == 200, f"Registration failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def employee_auth(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}
