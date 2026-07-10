import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
let accessToken: string;

test.describe("Integrations", () => {
  test.beforeAll(async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: `int_${ts}@test.com`,
        name: "Integ Tester",
        password: "Test123!",
        password_confirmation: "Test123!",
      },
    });
    const body = await res.json();
    accessToken = body.access_token;
  });

  test("GitHub repo proxy returns auth error (no PAT configured)", async ({
    request,
  }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Authentication failed");
  });

  test("GitHub commits proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/commits`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub pulls proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/pulls`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub issues proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/issues`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub branches proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/branches`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub releases proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/releases`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub contributors proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/contributors`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("GitHub languages proxy returns auth error", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/languages`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("Figma file proxy returns forbidden (no valid key)", async ({
    request,
  }) => {
    const res = await request.get(`${API}/api/v1/figma/files/test_file`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Access denied");
  });

  test("GitHub proxy returns public repo data without PAT", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Hello-World");
    expect(body.owner.login).toBe("octocat");
  });
});
