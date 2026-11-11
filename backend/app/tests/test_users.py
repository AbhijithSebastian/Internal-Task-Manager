from fastapi.testclient import TestClient


class TestUsersAPI:
    def test_list_users(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/users", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_get_user(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/users?per_page=1", headers=admin_auth)
        user_id = resp.json()["items"][0]["id"]
        resp = client.get(f"/api/v1/users/{user_id}", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == user_id
        assert "password" not in data

    def test_get_user_not_found(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/users/99999", headers=admin_auth)
        assert resp.status_code == 404

    def test_get_user_no_auth(self, client: TestClient):
        resp = client.get("/api/v1/users")
        assert resp.status_code == 403

    def test_search_users(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/users/search?q=admin", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_update_user(self, client: TestClient, admin_auth, employee_token):
        emp = client.get(
            "/api/v1/users?per_page=1&search=employee",
            headers=admin_auth,
        )
        users = emp.json().get("items", [])
        if not users:
            return
        uid = users[0]["id"]
        resp = client.put(
            f"/api/v1/users/{uid}",
            json={"job_title": "Senior Tester"},
            headers=admin_auth,
        )
        assert resp.status_code == 200
        assert resp.json()["job_title"] == "Senior Tester"
