from fastapi.testclient import TestClient


class TestIntegrationsAPI:
    def setup_project(self, client, admin_auth):
        resp = client.post(
            "/api/v1/projects",
            json={"name": "Integration Test Project"},
            headers=admin_auth,
        )
        return resp.json()["id"]

    def test_create_integration(self, client: TestClient, admin_auth):
        pid = self.setup_project(client, admin_auth)
        resp = client.post(
            "/api/v1/integrations",
            json={
                "project_id": pid,
                "type": "github",
                "label": "Test GitHub",
                "config": {"repo": "test/repo"},
            },
            headers=admin_auth,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "github"
        assert data["is_active"] is True

    def test_list_integrations(self, client: TestClient, admin_auth):
        resp = client.get("/api/v1/integrations", headers=admin_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    def test_sync_unknown_type(self, client: TestClient, admin_auth):
        pid = self.setup_project(client, admin_auth)
        create = client.post(
            "/api/v1/integrations",
            json={
                "project_id": pid,
                "type": "unknown_type",
                "label": "Bad",
                "config": {},
            },
            headers=admin_auth,
        )
        iid = create.json()["id"]
        resp = client.post(
            f"/api/v1/integrations/{iid}/sync",
            headers=admin_auth,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "Sync failed" in data["message"] or "error" in str(data)

    def test_sync_deactivated(self, client: TestClient, admin_auth):
        pid = self.setup_project(client, admin_auth)
        create = client.post(
            "/api/v1/integrations",
            json={
                "project_id": pid,
                "type": "github",
                "label": "Deact Test",
                "config": {},
            },
            headers=admin_auth,
        )
        iid = create.json()["id"]
        client.put(
            f"/api/v1/integrations/{iid}",
            json={"is_active": False},
            headers=admin_auth,
        )
        resp = client.post(
            f"/api/v1/integrations/{iid}/sync",
            headers=admin_auth,
        )
        assert resp.status_code == 404

    def test_delete_integration(self, client: TestClient, admin_auth):
        pid = self.setup_project(client, admin_auth)
        create = client.post(
            "/api/v1/integrations",
            json={
                "project_id": pid,
                "type": "email_hook",
                "label": "Del Test",
                "config": {},
            },
            headers=admin_auth,
        )
        iid = create.json()["id"]
        resp = client.delete(f"/api/v1/integrations/{iid}", headers=admin_auth)
        assert resp.status_code == 200
