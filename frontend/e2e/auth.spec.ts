import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
let testEmail: string;
let accessToken: string;

test.describe("Authentication", () => {
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
  });

  test("login with correct credentials", async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: testEmail, password: "Test123!" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    accessToken = body.access_token;
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
  });

  test("get /me returns current user", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(testEmail);
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
});
