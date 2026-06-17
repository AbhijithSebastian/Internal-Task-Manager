from fastapi.testclient import TestClient


class TestAuthorization:
    def test_employee_cannot_delete_users(self, client: TestClient, employee_auth):
        resp = client.get("/api/v1/users?per_page=1", headers=employee_auth)
        users = resp.json().get("items", [])
        if not users:
            return
        uid = users[0]["id"]
        resp = client.delete(f"/api/v1/users/{uid}", headers=employee_auth)
        assert resp.status_code == 403

    def test_employee_cannot_create_projects(self, client: TestClient, employee_auth):
        resp = client.post(
            "/api/v1/projects",
            json={"name": "Unauthorized Project"},
            headers=employee_auth,
        )
        assert resp.status_code == 403

    def test_employee_can_view_own_profile(self, client: TestClient, employee_token):
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {employee_token}"},
        )
        assert resp.status_code == 200

    def test_unauthenticated_access_blocked(self, client: TestClient):
        resp = client.get("/api/v1/users")
        assert resp.status_code in (401, 403)

    def test_unauthenticated_access_allowed_for_health(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
