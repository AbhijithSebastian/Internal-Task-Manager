import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Collect errors
page.on("console", msg => { if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text()); });
page.on("response", r => { if (r.status() >= 400) console.log("HTTP ERROR:", r.status(), r.url()); });

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

// Find task data rows (not header rows)
const taskButtons = await page.$$("button:not(:has-text('Status'))");
console.log("Task buttons found:", taskButtons.length);

let opened = false;
for (const btn of taskButtons) {
  const text = await btn.textContent();
  // Skip non-task buttons (sidebar, header buttons, etc.)
  if (!text || text.includes("New Task") || text.includes("Dashboard") || text.includes("Projects") || text.length < 3) continue;
  
  console.log("Clicking task:", text.substring(0, 60));
  await btn.click();
  await page.waitForTimeout(1200);
  
  // Check for the Drawer panel (right-side panel with max-w-[560px])
  // The sidebar has z-drawer but is on the left. The actual drawer panel has classes: absolute right-0, animate-slide-in-right
  const drawerPanel = await page.$("[class*='right-0'][class*='animate-slide-in-right']");
  if (drawerPanel) {
    const visible = await drawerPanel.isVisible();
    const box = await drawerPanel.boundingBox();
    console.log("Drawer panel visible:", visible, "box:", JSON.stringify(box));
    opened = true;
    break;
  }
  
  // Alternative: check for the Drawer wrapper (portaled to body with z-drawer-bg)
  const drawerWrapper = await page.$("body > [class*='z-drawer-bg']");
  if (drawerWrapper) {
    const visible = await drawerWrapper.isVisible();
    console.log("Drawer wrapper (portaled) visible:", visible);
    opened = true;
    break;
  }
  
  // Close if opened
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

if (!opened) {
  console.log("No task drawer opened via buttons.");
  // Try clicking table rows
  const rows = await page.$$("tr");
  for (let i = 1; i < rows.length; i++) { // skip header row
    try {
      await rows[i].click();
      await page.waitForTimeout(1200);
      const drawerWrapper = await page.$("body > [class*='z-drawer-bg']");
      if (drawerWrapper) {
        const visible = await drawerWrapper.isVisible();
        console.log("Drawer opened via row click, visible:", visible);
        opened = true;
        break;
      }
      await page.keyboard.press("Escape");
    } catch {}
  }
}

if (!opened) {
  console.log("FAIL: Could not open any task drawer");
} else {
  console.log("PASS: Task drawer works correctly");
}

// Screenshot the page with drawer open
await page.screenshot({ path: "task-drawer-test.png" });
console.log("Screenshot saved: task-drawer-test.png");

await browser.close();
