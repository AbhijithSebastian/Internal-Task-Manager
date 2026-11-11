import pytest_asyncio
from httpx import AsyncClient
from main import app

# Import base fixtures from core tests
from app.tests.conftest import (
    client,
    db,
    _clean_test_data,
    admin_token,
    admin_auth,
    employee_token,
    employee_auth,
)

@pytest_asyncio.fixture
async def auth_client(admin_token):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        ac.headers.update({"Authorization": f"Bearer {admin_token}"})
        yield ac
