from fastapi.testclient import TestClient


class TestProjectsAPI:
    def test_list_projects(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/projects", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    def test_create_project(self, client: TestClient, admin_auth):
        resp = client.post(
            "/api/v1/projects",
            json={
                "name": "Test Project",
                "description": "Created during testing",
                "priority": "medium",
            },
            headers=admin_auth,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["name"] == "Test Project"
        assert data["status"] == "active"
        assert "id" in data

    def test_get_project(self, client: TestClient, admin_auth):
        create = client.post(
            "/api/v1/projects",
            json={"name": "Test Get Project"},
            headers=admin_auth,
        )
        pid = create.json()["id"]
        resp = client.get(f"/api/v1/projects/{pid}", headers=admin_auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == pid

    def test_get_project_not_found(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/projects/99999", headers=admin_auth)
        assert resp.status_code == 404

    def test_update_project(self, client: TestClient, admin_auth):
        create = client.post(
            "/api/v1/projects",
            json={"name": "Test Update Project"},
            headers=admin_auth,
        )
        pid = create.json()["id"]
        resp = client.put(
            f"/api/v1/projects/{pid}",
            json={"name": "Updated Project"},
            headers=admin_auth,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Project"

    def test_delete_project_soft(self, client: TestClient, admin_auth):
        create = client.post(
            "/api/v1/projects",
            json={"name": "Test Delete Project"},
            headers=admin_auth,
        )
        pid = create.json()["id"]
        resp = client.delete(f"/api/v1/projects/{pid}", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Project deleted successfully"

        # Verify the project no longer appears in listings (soft delete)
        list_resp = client.get("/api/v1/projects", headers=admin_auth)
        pids = [p["id"] for p in list_resp.json()["items"]]
        assert pid not in pids, "Soft-deleted project should not appear in list"

    def test_search_projects(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/projects/search?q=test", headers=admin_auth)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
