import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
let accessToken: string;

test.describe("API Endpoints", () => {
  test.beforeAll(async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: `api_${ts}@test.com`,
        name: "API Tester",
        password: "Test123!",
        password_confirmation: "Test123!",
      },
    });
    const body = await res.json();
    accessToken = body.access_token;
  });

  test("health/live returns alive", async ({ request }) => {
    const res = await request.get(`${API}/health/live`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("alive");
  });

  test("health/ready returns ready with DB connected", async ({ request }) => {
    const res = await request.get(`${API}/health/ready`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.database).toBe("connected");
  });

  test("projects list returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("per_page");
  });

  test("projects create returns 403 for non-admin", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: { name: "Unauthorized Project" },
    });
    expect(res.status()).toBe(403);
  });

  test("tasks list returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/tasks?project_id=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
  });

  test("meetings list returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/meetings?project_id=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
  });

  test("resources list returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/resources?project_id=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
  });

  test("endpoints list returns paginated response", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/endpoints?project_id=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
  });

  test("search returns results for authenticated user", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/search?q=test`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("users");
    expect(body).toHaveProperty("projects");
    expect(body).toHaveProperty("tasks");
  });

  test("users list returns 403 for non-admin", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test("invalid route returns 404", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/nonexistent`);
    expect(res.status()).toBe(404);
  });
});
