import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:80/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
if (page.url().includes("login")) {
  await page.fill('input[type="email"], input[name="email"]', "admin@company.com");
  await page.fill('input[type="password"], input[name="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await page.waitForTimeout(1000);
}

await page.goto("http://localhost:80/work/tasks", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(1500);

const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
console.log("Body text:", bodyText);

const rows = await page.$$("tr, [class*='row'], [class*='cursor-pointer']");
console.log("Rows found:", rows.length);

for (let i = 0; i < Math.min(5, rows.length); i++) {
  const text = await rows[i].textContent();
  console.log("Row", i, ":", (text || "").substring(0, 80));
  try {
    await rows[i].click();
    await page.waitForTimeout(1200);
    const drawers = await page.$$("[class*='z-drawer']");
    console.log("  Drawers found:", drawers.length);
    if (drawers.length > 0) {
      const visible = await drawers[0].isVisible();
      console.log("  Drawer visible:", visible);
      const box = await drawers[0].boundingBox();
      if (box) console.log("  Drawer box:", JSON.stringify(box));
      break;
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    console.log("  Click error:", e.message.substring(0, 100));
  }
}

await browser.close();
