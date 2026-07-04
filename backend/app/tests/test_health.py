from fastapi.testclient import TestClient


class TestHealthCheck:
    def test_health_check(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("ok", "degraded")
        assert "database" in data
        assert "app" in data
        assert "version" in data
        assert "environment" in data
        assert "timestamp" in data

    def test_liveness(self, client: TestClient):
        resp = client.get("/health/live")
        assert resp.status_code == 200
        assert resp.json()["status"] == "alive"

    def test_readiness(self, client: TestClient):
        resp = client.get("/health/ready")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "database" in data
