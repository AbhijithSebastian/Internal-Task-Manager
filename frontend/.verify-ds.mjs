import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:5199";

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err)));

await page.goto(`${BASE}/design-system`, { waitUntil: "networkidle", timeout: 60000 });

const result = {};

result.title = await page.title();
result.headings = await page.locator("h2").allTextContents();
result.sectionCount = await page.locator("section[id]").count();
result.sectionIds = await page.locator("section[id]").evaluateAll((els) => els.map((e) => e.id));

// Font actually applied
result.fontFamily = await page
  .locator("h2")
  .first()
  .evaluate((el) => getComputedStyle(el).fontFamily);

// Primary button colour must be primary-1000 #0a65e4
const primaryBtn = page.getByRole("button", { name: "Primary", exact: true }).first();
result.primaryButtonBg = await primaryBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
result.primaryButtonHeight = await primaryBtn.evaluate((el) => getComputedStyle(el).height);
result.primaryButtonRadius = await primaryBtn.evaluate((el) => getComputedStyle(el).borderRadius);

// Card surface + border
const card = page.locator(".rounded-md.border").first();
result.cardBorderColor = await card.evaluate((el) => getComputedStyle(el).borderColor);
result.cardRadius = await card.evaluate((el) => getComputedStyle(el).borderRadius);

// Semantic tokens resolved on :root
result.tokens = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  const pick = (name) => s.getPropertyValue(name).trim();
  return {
    bgSurface: pick("--bg-surface"),
    textPrimary: pick("--text-primary"),
    borderDefault: pick("--border-default"),
    primary: pick("--primary"),
    radiusControl: pick("--radius-control"),
    radiusButton: pick("--radius-button"),
    navbarHeight: pick("--navbar-height"),
  };
});

// Swatch count (primitive palette should be fully rendered)
result.swatchCount = await page.locator("p.font-mono").count();

// Modal interaction
await page.getByRole("button", { name: "Open modal" }).click();
await page.waitForTimeout(400);
result.modalVisible = await page.getByRole("dialog").isVisible().catch(() => false);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
result.modalClosedOnEscape = !(await page.getByRole("dialog").isVisible().catch(() => false));

// Drawer interaction
await page.getByRole("button", { name: "Open drawer" }).click();
await page.waitForTimeout(500);
result.drawerVisible = await page.getByRole("dialog").isVisible().catch(() => false);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// Horizontal overflow check
result.horizontalOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);

await page.screenshot({ path: "../tmp-design-system.png", fullPage: true });

// Login redirect behaviour for a protected route (no auth)
await page.goto(`${BASE}/work/tasks`, { waitUntil: "networkidle", timeout: 60000 });
result.protectedRedirect = new URL(page.url()).pathname;

result.consoleErrors = consoleErrors;
result.pageErrors = pageErrors;

console.log(JSON.stringify(result, null, 2));

await browser.close();
