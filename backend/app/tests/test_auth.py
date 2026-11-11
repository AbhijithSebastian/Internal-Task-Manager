from fastapi.testclient import TestClient


class TestAuthentication:
    def test_login_success(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "abhijith@tool.com", "password": "password"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "abhijith@tool.com"
        assert "password" not in str(data)

    def test_login_invalid_password(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "abhijith@tool.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )
        assert resp.status_code == 401

    def test_register_success(self, client: TestClient):
        import random
        suffix = random.randint(10000, 99999)
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": f"New User {suffix}",
                "email": f"newuser{suffix}@example.com",
                "password": "Password123!",
                "password_confirmation": "Password123!",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == f"newuser{suffix}@example.com"

    def test_register_password_mismatch(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Bad User",
                "email": "baduser@example.com",
                "password": "Password123!",
                "password_confirmation": "DifferentPassword123!",
            },
        )
        assert resp.status_code == 422

    def test_register_duplicate_email(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Duplicate",
                "email": "abhijith@tool.com",
                "password": "Password123!",
                "password_confirmation": "Password123!",
            },
        )
        assert resp.status_code == 409

    def test_refresh_token(self, client: TestClient):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "abhijith@tool.com", "password": "password"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_refresh_invalid_token(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token-here"},
        )
        assert resp.status_code == 401

    def test_get_me(self, client: TestClient, admin_token):
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "abhijith@tool.com"
        assert "password" not in data
        assert "id" in data
        assert "name" in data
        assert "role" in data
        assert "permissions" in data
        assert "roles" in data

    def test_get_me_no_auth(self, client: TestClient):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 403

    def test_get_me_invalid_token(self, client: TestClient):
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_forgot_password(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "abhijith@tool.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data

    def test_forgot_password_nonexistent(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_reset_password_flow(self, client: TestClient):
        fp_resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "abhijith@tool.com"},
        )
        token = fp_resp.json().get("debug_token", "")
        assert token, "No debug token returned"

        resp = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token,
                "email": "abhijith@tool.com",
                "password": "resetpass123!",
                "password_confirmation": "resetpass123!",
            },
        )
        assert resp.status_code == 200

        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "abhijith@tool.com", "password": "resetpass123!"},
        )
        assert login_resp.status_code == 200

        # Restore password
        fp_resp2 = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "abhijith@tool.com"},
        )
        token2 = fp_resp2.json()["debug_token"]
        client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token2,
                "email": "abhijith@tool.com",
                "password": "password",
                "password_confirmation": "password",
            },
        )

    def test_logout(self, client: TestClient, admin_token):
        resp = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
