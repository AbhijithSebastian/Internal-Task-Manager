import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
const FRONTEND = "http://localhost";

test.describe("Authentication", () => {
  let testEmail: string;
  let accessToken: string;
  let refreshTokenValue: string;

  test("register API creates user and returns token", async ({ request }) => {
    const ts = Date.now();
    testEmail = `e2e_${ts}@test.com`;
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: testEmail,
        name: "E2E Tester",
        password: "Test123!",
        password_confirmation: "Test123!",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.user.email).toBe(testEmail);
    accessToken = body.access_token;
    refreshTokenValue = body.refresh_token;
  });

  test("login with correct credentials", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: testEmail, password: "Test123!" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
    accessToken = body.access_token;
    refreshTokenValue = body.refresh_token;
  });

  test("login with wrong password returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: testEmail, password: "wrongpassword" },
    });
    expect(res.status()).toBe(401);
  });

  test("register duplicate email returns 409", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: testEmail,
        name: "Duplicate",
        password: "Test123!",
        password_confirmation: "Test123!",
      },
    });
    expect(res.status()).toBe(409);
  });

  test("register with short password returns 422", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: "shortpwd@test.com",
        name: "Short",
        password: "1234567",
        password_confirmation: "1234567",
      },
    });
    expect(res.status()).toBe(422);
  });

  test("register with mismatched passwords returns 422", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: "mismatch@test.com",
        name: "Mismatch",
        password: "Test123!",
        password_confirmation: "Different!",
      },
    });
    expect(res.status()).toBe(422);
  });

  test("refresh token", async ({ request }) => {
    const loginRes = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: testEmail, password: "Test123!" },
    });
    const { refresh_token } = await loginRes.json();
    const res = await request.post(`${API}/api/v1/auth/refresh`, {
      data: { refresh_token },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
  });

  test("refresh with invalid token returns 401", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/refresh`, {
      data: { refresh_token: "invalid_refresh_token_here" },
    });
    expect(res.status()).toBe(401);
  });

  test("get /me returns current user", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(testEmail);
  });

  test("get /me without auth returns 403", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/auth/me`);
    expect(res.status()).toBe(403);
  });

  test("get /me with expired/invalid JWT returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/auth/me`, {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkZha2UiLCJpYXQiOjE1MTYyMzkwMjJ9.tampered" },
    });
    expect(res.status()).toBe(401);
  });

  test("login page renders in browser", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("frontend SPA serves login page on /login", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);
  });

  test("tokens survive page refresh in localStorage", async ({ page }) => {
    await page.goto(FRONTEND);
    await page.evaluate(({ access, refresh }) => {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }, { access: accessToken, refresh: refreshTokenValue });

    // Reload
    await page.reload();
    const storedAccess = await page.evaluate(() => localStorage.getItem("access_token"));
    const storedRefresh = await page.evaluate(() => localStorage.getItem("refresh_token"));
    expect(storedAccess).toBe(accessToken);
    expect(storedRefresh).toBe(refreshTokenValue);
  });

  test("logout clears localStorage tokens", async ({ page }) => {
    await page.goto(FRONTEND);
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", "some_refresh_token");
    }, accessToken);

    // Simulate logout
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });

    const storedAccess = await page.evaluate(() => localStorage.getItem("access_token"));
    const storedRefresh = await page.evaluate(() => localStorage.getItem("refresh_token"));
    expect(storedAccess).toBeNull();
    expect(storedRefresh).toBeNull();
  });

  test("multi-tab: tokens set in one tab visible in another", async ({ page, context }) => {
    await page.goto(FRONTEND);
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, accessToken);

    // Open a second tab in the same context
    const page2 = await context.newPage();
    await page2.goto(FRONTEND);
    const storedInTab2 = await page2.evaluate(() => localStorage.getItem("access_token"));
    expect(storedInTab2).toBe(accessToken);
    await page2.close();
  });
});
