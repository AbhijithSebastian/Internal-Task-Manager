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
    settings.database_url,
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


@pytest.fixture(scope="session", autouse=True)
def _clean_test_data():
    from app.core.database import SessionLocal
    from app.users.models import User
    from app.roles.models import Role
    from app.core.security import get_password_hash

    db = SessionLocal()
    try:
        # Clean up existing test users and their relationships via raw SQL cascade
        from sqlalchemy import text
        db.execute(text("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email IN ('abhijith@tool.com', 'test_employee@example.com'))"))
        db.execute(text("DELETE FROM users WHERE email IN ('abhijith@tool.com', 'test_employee@example.com')"))
        db.commit()

        # Seed admin user for tests (using password as expected by auth tests)
        admin = User(
            name="Super Admin",
            email="abhijith@tool.com",
            password=get_password_hash("password"),
            is_active=True,
        )
        db.add(admin)
        db.flush()
        
        admin_role = db.query(Role).filter(Role.name == "super-admin").first()
        if admin_role:
            admin.roles.append(admin_role)

        # Seed employee user for tests
        employee = User(
            name="Test Employee",
            email="test_employee@example.com",
            password=get_password_hash("Test123!"),
            is_active=True,
            job_title="Tester",
        )
        db.add(employee)
        db.flush()

        employee_role = db.query(Role).filter(Role.name == "employee").first()
        if employee_role:
            employee.roles.append(employee_role)

        db.commit()
    finally:
        db.close()


@pytest.fixture
def admin_token(client, _clean_test_data):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "abhijith@tool.com", "password": "password"},
    )
    # If the reset password test modified it, try falling back to the reset password
    if resp.status_code != 200:
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "abhijith@tool.com", "password": "resetpass123!"},
        )
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
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
    assert resp.status_code == 200, f"Employee login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
def employee_auth(employee_token):
    return {"Authorization": f"Bearer {employee_token}"}
