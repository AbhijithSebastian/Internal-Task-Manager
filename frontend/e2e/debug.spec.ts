import { test } from "@playwright/test";

const API = "http://localhost:8000";
const FE = "http://localhost";

test("connect public repo - new build", async ({ page, request }) => {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { email: "admin@company.com", password: "password" },
  });
  const { access_token, refresh_token } = await res.json();

  // Clear project github_url
  await request.put(`${API}/api/v1/projects/3`, {
    headers: { Authorization: `Bearer ${access_token}` },
    data: { github_url: "" },
  });

  // Track ALL API responses
  const apiResponses: { url: string; status: number; body: string }[] = [];
  page.on("response", async (resp) => {
    if (resp.url().includes("/api/v1")) {
      const body = await resp.text().catch(() => "");
      apiResponses.push({ url: resp.url(), status: resp.status(), body: body.substring(0, 300) });
      console.log(`RESP: ${resp.status()} ${resp.url().replace(API, "").replace(FE, "")}`);
      if (resp.status() >= 400) console.log(`  BODY: ${body.substring(0, 300)}`);
    }
  });

  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) console.log("NAV:", frame.url());
  });

  // Navigate and set tokens
  await page.goto(`${FE}/work/projects/3/github`);
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem("access_token", at);
      localStorage.setItem("refresh_token", rt);
    },
    { at: access_token, rt: refresh_token },
  );
  await page.goto(`${FE}/work/projects/3/github`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  console.log("\n=== CONNECTING ===");
  await page.locator('button:has-text("Connect GitHub")').first().click();
  await page.waitForTimeout(500);
  await page.fill("#repository-url", "https://github.com/octocat/Hello-World");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  console.log("\n=== FINAL URL:", page.url());
  const bodyText = await page
    .locator("body")
    .textContent()
    .catch(() => "");
  console.log("Body:", bodyText?.substring(0, 1500));
  await page.screenshot({ path: "e2e-screenshots/new-build-connect.png", fullPage: true });
});
