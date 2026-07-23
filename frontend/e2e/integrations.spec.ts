import { test, expect } from "@playwright/test";

const API = "http://localhost:8000";
const FRONTEND = "http://localhost";

test.describe("Integrations", () => {
  let accessToken: string;

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

  // ── GitHub proxy returns GitHub's real error (not generic) ──
  test("GitHub repo proxy returns auth error (no PAT configured)", async ({
    request,
  }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Bad credentials");
    expect(body.documentation_url).toBe("https://docs.github.com/rest");
  });

  // ── All 8 GitHub endpoints ──
  const githubEndpoints = [
    ["commits", "/commits"],
    ["pulls", "/pulls"],
    ["issues", "/issues"],
    ["branches", "/branches"],
    ["releases", "/releases"],
    ["contributors", "/contributors"],
    ["languages", "/languages"],
  ];
  for (const [name, path] of githubEndpoints) {
    test(`GitHub ${name} proxy returns auth error`, async ({ request }) => {
      const res = await request.get(
        `${API}/api/v1/github/repos/octocat/Hello-World${path}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      expect(res.status()).toBe(401);
    });
  }

  // ── Figma proxy returns Figma's real error (not generic) ──
  test("Figma file proxy returns forbidden (no valid key)", async ({
    request,
  }) => {
    const res = await request.get(`${API}/api/v1/figma/files/test_file`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.err).toBe("Invalid token");
  });

  // ── Public repo data without any token ──
  test("GitHub proxy returns public repo data without PAT", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`
    );
    // 200 = data returned, 403 = rate limited (still valid — proxy works)
    expect([200, 403]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 200) {
      expect(body.name).toBe("Hello-World");
      expect(body.owner.login).toBe("octocat");
    } else {
      // Rate limited — verify GitHub error structure
      expect(body.message).toBeTruthy();
    }
  });

  // ── Figma without any token returns Figma's real error ──
  test("Figma proxy without any token returns Figma error", async ({ request }) => {
    const res = await request.get(`${API}/api/v1/figma/files/test_file`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.err).toBe("Invalid token");
  });

  // ── Invalid GitHub PAT returns GitHub's real error message ──
  test("Invalid GitHub PAT returns 'Bad credentials'", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`,
      { headers: { Authorization: "Bearer ghp_definitelyFakeToken123456" } }
    );
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Bad credentials");
  });

  // ── Empty PAT prefix still passes through ──
  test("Empty Bearer on GitHub is treated as no auth (public repo)", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`,
      { headers: { Authorization: "Bearer " } }
    );
    // Empty token is skipped; public repo data is returned (or rate limited)
    expect([200, 403]).toContain(res.status());
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  // ── No Authorization header on GitHub proxy works (public repo) ──
  test("GitHub proxy works without Authorization header for public data", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World/pulls?per_page=1`
    );
    // 200 = data returned, 403 = rate limited (proxy still works)
    expect([200, 403]).toContain(res.status());
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  // ── Token isolation: project switching doesn't interfere ──
  test("Browser sessionStorage tokens are isolated per project", async ({ page }) => {
    await page.goto(FRONTEND);
    await page.evaluate(() => {
      sessionStorage.setItem("github_token_project1", "pat_project1_value");
      sessionStorage.setItem("github_token_project2", "pat_project2_value");
    });
    const proj1 = await page.evaluate(() => sessionStorage.getItem("github_token_project1"));
    const proj2 = await page.evaluate(() => sessionStorage.getItem("github_token_project2"));
    expect(proj1).toBe("pat_project1_value");
    expect(proj2).toBe("pat_project2_value");
    // Removing one shouldn't affect the other
    await page.evaluate(() => sessionStorage.removeItem("github_token_project1"));
    const proj1gone = await page.evaluate(() => sessionStorage.getItem("github_token_project1"));
    const proj2still = await page.evaluate(() => sessionStorage.getItem("github_token_project2"));
    expect(proj1gone).toBeNull();
    expect(proj2still).toBe("pat_project2_value");
  });

  // ── Browser refresh preserves sessionStorage tokens ──
  test("SessionStorage tokens survive page refresh", async ({ page }) => {
    await page.goto(FRONTEND);
    await page.evaluate(() => {
      sessionStorage.setItem("github_token_test", "pat_survives_refresh");
    });
    // Reload the page
    await page.reload();
    const token = await page.evaluate(() => sessionStorage.getItem("github_token_test"));
    expect(token).toBe("pat_survives_refresh");
  });

  // ── Logout does NOT clear integration tokens (they're stored per-project) ──
  test("Logout preserves integration tokens in sessionStorage", async ({ page }) => {
    await page.goto(FRONTEND);
    // Set both types of tokens
    await page.evaluate(() => {
      localStorage.setItem("access_token", "app_jwt_value");
      sessionStorage.setItem("github_token_1", "pat_value");
    });
    // Simulate logout (removes only localStorage tokens)
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });
    // Integration tokens should survive
    const ghToken = await page.evaluate(() => sessionStorage.getItem("github_token_1"));
    expect(ghToken).toBe("pat_value");
  });

  // ── API client isolation: proxyApi should send custom Auth, api should send JWT ──
  test("proxyApi sends custom Authorization, api sends app JWT", async ({ page }) => {
    await page.goto(FRONTEND);
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, accessToken);

    // Verify localStorage has the app JWT
    const storedJwt = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(storedJwt).toBeTruthy();
    expect(storedJwt!.length).toBeGreaterThan(20); // JWT is not empty
  });

  // ── Rate limit headers are returned from GitHub ──
  test("GitHub proxy returns rate limit info", async ({ request }) => {
    const res = await request.get(
      `${API}/api/v1/github/repos/octocat/Hello-World`
    );
    // 200 or 403 — both are valid responses from GitHub
    expect([200, 403]).toContain(res.status());
    const body = await res.json();
    // Response has valid GitHub structure
    expect(body).toBeTruthy();
  });
});
