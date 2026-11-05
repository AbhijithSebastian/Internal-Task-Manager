import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", msg => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});

async function login() {
  await page.goto("http://localhost:80/dashboard", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(500);
  if (page.url().includes("login")) {
    await page.fill('input[type="email"], input[name="email"]', "admin@company.com");
    await page.fill('input[type="password"], input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await page.waitForTimeout(1000);
  }
}

await login();

// Go to Users page
await page.goto("http://localhost:80/work/users", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(1500);

// Before opening drawer, capture a baseline screenshot and analyze computed styles
console.log("\n=== BASELINE (before drawer) ===");

// Check key element positions and computed styles
const baseline = await page.evaluate(() => {
  function g(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      pos: s.position,
      z: s.zIndex,
      xfrm: s.transform,
      contain: s.containerType,
      clip: s.clip,
      overflow: s.overflow,
      cls: (el.getAttribute("class") || "").substring(0, 80),
      rect: `${r.left|0},${r.top|0} ${r.width|0}x${r.height|0}`,
    };
  }
  return {
    sidebar: g("aside"),
    header: g("header"),
    root: g("#root"),
    body: { overflow: getComputedStyle(document.body).overflow, scrollbarWidth: window.innerWidth - document.documentElement.clientWidth },
  };
});
console.log("Sidebar:", baseline.sidebar);
console.log("Header:", baseline.header);
console.log("Root:", baseline.root);
console.log("Body:", baseline.body);

// Now open the user detail drawer
console.log("\n=== OPENING DRAWER ===");
const rows = await page.$$("table tr");
for (let i = 1; i < rows.length; i++) {
  const text = await rows[i].textContent();
  if (text && text.includes("@")) {
    console.log("Clicking user row:", (text || "").substring(0, 50));
    await rows[i].click();
    break;
  }
}
await page.waitForTimeout(1500);

// Capture after drawer open
const after = await page.evaluate(() => {
  function g(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      pos: s.position,
      z: s.zIndex,
      xfrm: s.transform !== "none" ? s.transform.substring(0, 60) : "",
      contain: s.containerType,
      overflow: s.overflow,
      cls: (el.getAttribute("class") || "").substring(0, 80),
      rect: `${r.left|0},${r.top|0} ${r.width|0}x${r.height|0}`,
    };
  }
  const results = {
    sidebar: g("aside"),
    header: g("header"),
    body: { overflow: getComputedStyle(document.body).overflow },
  };

  // Find portaled drawer elements
  const drawers = [];
  for (let i = 0; i < document.body.children.length; i++) {
    const el = document.body.children[i];
    const cls = el.getAttribute("class") || "";
    if (cls.includes("z-drawer") || cls.includes("z-modal")) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const children = [];
      for (let j = 0; j < el.children.length; j++) {
        const c = el.children[j];
        const cs = getComputedStyle(c);
        const cr = c.getBoundingClientRect();
        children.push({
          tag: c.tagName,
          cls: (c.getAttribute("class") || "").substring(0, 80),
          pos: cs.position,
          z: cs.zIndex,
          rect: `${cr.left|0},${cr.top|0} ${cr.width|0}x${cr.height|0}`,
        });
      }
      drawers.push({
        pos: s.position,
        z: s.zIndex,
        cls: cls.substring(0, 80),
        rect: `${r.left|0},${r.top|0} ${r.width|0}x${r.height|0}`,
        children,
      });
    }
  }
  results.drawers = drawers;

  // Check for any fixed elements above z-200
  results.highZ = [];
  const all = document.querySelectorAll("*");
  for (const el of all) {
    const s = getComputedStyle(el);
    const z = parseInt(s.zIndex);
    if (!isNaN(z) && z > 200) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        results.highZ.push({
          tag: el.tagName,
          cls: (el.getAttribute("class") || "").substring(0, 60),
          z,
          pos: s.position,
          rect: `${r.left|0},${r.top|0} ${r.width|0}x${r.height|0}`,
        });
      }
    }
    if (results.highZ.length > 30) break;
  }

  return results;
});

console.log("\n=== AFTER DRAWER OPEN ===");
console.log("Sidebar:", after.sidebar);
console.log("Header:", after.header);
console.log("Body:", after.body);
console.log("\nPortal Drawers:");
for (const d of after.drawers) {
  console.log(`  Wrapper: pos=${d.pos} z=${d.z} rect=${d.rect} cls="${d.cls}"`);
  for (const c of d.children) {
    console.log(`    Child <${c.tag}> pos=${c.pos} z=${c.z} rect=${c.rect} cls="${c.cls}"`);
  }
}
console.log("\nHigh z-index elements (> 200):");
for (const h of after.highZ) {
  console.log(`  <${h.tag}> z=${h.z} pos=${h.pos} rect=${h.rect} cls="${h.cls}"`);
}

// Take full-page screenshot
await page.screenshot({ path: "debug-drawer-full.png", fullPage: false });
console.log("\nScreenshot saved: debug-drawer-full.png");

// Also take a screenshot with drawer + SearchModal (Cmd+K)
await page.keyboard.press("Meta+k");
await page.waitForTimeout(1000);
await page.screenshot({ path: "debug-modal-over-drawer.png", fullPage: false });
console.log("Screenshot saved: debug-modal-over-drawer.png");

// Close SearchModal with Escape
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

// Now also check the RoleListPage (which has inline modal)
console.log("\n=== CHECKING ROLE LIST PAGE ===");
await page.goto("http://localhost:80/work/admin/roles", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(1500);

// Click a role to open detail panel
const roleCards = await page.$$("[class*='card'], [class*='Card']");
if (roleCards.length > 0) {
  await roleCards[0].click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "debug-role-panel.png", fullPage: false });
  console.log("Screenshot saved: debug-role-panel.png");
}

await browser.close();
