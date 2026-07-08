import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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
await page.waitForTimeout(2000);

// Check current URL for view param
console.log("URL:", page.url());

// Get all rows (table view)
const rows = await page.$$("tr");
console.log("Total rows:", rows.length);

let opened = false;
for (let i = 0; i < rows.length; i++) {
  const text = await rows[i].textContent();
  console.log("Row", i, ":", (text || "").substring(0, 80).replace(/\n/g, " "));
  
  // Skip header row
  if (text && (text.includes("Task") || text.includes("Status") || text.includes("Priority"))) {
    console.log("  -> header, skipping");
    continue;
  }
  
  try {
    await rows[i].click();
    await page.waitForTimeout(1200);
    
    // Check for portaled drawer wrapper
    const drawerBg = await page.$("body > div:last-child > [class*='z-drawer-bg']");
    const drawerPanel = await page.$("[class*='animate-slide-in-right'][class*='z-drawer']");
    
    if (drawerBg) {
      const visible = await drawerBg.isVisible();
      console.log("  Drawer backdrop visible:", visible);
      opened = true;
    }
    if (drawerPanel) {
      const visible = await drawerPanel.isVisible();
      const box = await drawerPanel.boundingBox();
      console.log("  Drawer panel visible:", visible, "box:", JSON.stringify(box));
      opened = true;
    }
    
    if (opened) {
      console.log("  PASS: Task drawer opened!");
      await page.screenshot({ path: "task-drawer-test2.png" });
      
      // Test Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
      const stillOpen = await page.$("body > div:last-child [class*='z-drawer-bg']");
      const stillVisible = stillOpen ? await stillOpen.isVisible() : false;
      console.log("  After Escape, drawer open:", stillVisible);
      break;
    }
    
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    console.log("  Error:", e.message.substring(0, 100));
  }
}

if (!opened) {
  console.log("  Could not open task drawer via rows");
  // Try board view explicitly
  console.log("\nTrying board view...");
  
  // Check for view toggle buttons
  const viewBtns = await page.$$("button:has-text('Board'), button:has-text('board')");
  console.log("View buttons:", viewBtns.length);
  
  // Try clicking the board view
  for (const btn of viewBtns) {
    try {
      await btn.click();
      await page.waitForTimeout(1000);
      console.log("Clicked board view, URL:", page.url());
      break;
    } catch {}
  }
  
  // Now find task buttons in board view
  const boardTaskBtns = await page.$$("button.w-full.text-left");
  console.log("Board task buttons:", boardTaskBtns.length);
  
  for (const btn of boardTaskBtns) {
    try {
      await btn.click();
      await page.waitForTimeout(1200);
      const drawerWrapper = await page.$("body > div:last-child:not(div:first-child) > [class*='z-drawer-bg']");
      if (drawerWrapper) {
        console.log("  PASS: Task drawer opened from board view!");
        opened = true;
        break;
      }
      await page.keyboard.press("Escape");
    } catch {}
  }
}

console.log("\nFinal result:", opened ? "PASS" : "FAIL");
await browser.close();
