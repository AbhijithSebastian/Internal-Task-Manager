import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
let accessToken: string;

test.describe("Security", () => {
  test.beforeAll(async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: `sec_${ts}@test.com`,
        name: "Sec Tester",
        password: "Test123!",
        password_confirmation: "Test123!",
      },
    });
    const body = await res.json();
    accessToken = body.access_token;
  });

  test("JWT tampering returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/projects`, {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("no auth header returns 403 (not authenticated)", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/projects`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.detail).toBe("Not authenticated");
  });

  test("empty Bearer returns 403 (not authenticated)", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/projects`, {
      headers: { Authorization: "Bearer " },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.detail).toBe("Not authenticated");
  });

  test("SQL injection in search returns empty results", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/search?q=%27%20OR%201%3D1--`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.users).toEqual([]);
    expect(body.projects).toEqual([]);
    expect(body.tasks).toEqual([]);
  });

  test("XSS in search returns empty results", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.users).toEqual([]);
  });

  test("password shorter than 8 chars rejected", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: "short_pwd@test.com",
        name: "Short",
        password: "1234567",
        password_confirmation: "1234567",
      },
    });
    expect(res.status()).toBe(422);
  });

  test("password longer than 128 chars rejected", async ({ request }) => {
    const longPwd = "x".repeat(129);
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: "long_pwd@test.com",
        name: "Long",
        password: longPwd,
        password_confirmation: longPwd,
      },
    });
    expect(res.status()).toBe(422);
  });

  test("OPTIONS preflight returns restricted CORS headers", async ({ page }) => {
    const res = await page.request.fetch(`${API}/api/v1/projects`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://evil.com",
        "Access-Control-Request-Method": "DELETE",
      },
    });
    const headers = res.headers();
    expect(headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("OPTIONS preflight allows localhost origin", async ({ page }) => {
    const res = await page.request.fetch(`${API}/api/v1/projects`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });
    const headers = res.headers();
    expect(headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  test("security headers present", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/projects`);
    const headers = res.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
  });

  test("mass assignment extra fields ignored", async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: `mass_${ts}@test.com`,
        name: "Mass",
        password: "Test123!",
        password_confirmation: "Test123!",
        is_admin: true,
        role: "super-admin",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const user = body.user;
    expect(user.is_admin).toBeUndefined();
  });
});
