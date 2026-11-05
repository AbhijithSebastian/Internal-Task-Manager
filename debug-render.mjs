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
console.log("Logged in, URL:", page.url());

// Go to Users page and open UserDetailDrawer
await page.goto("http://localhost:80/work/users", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(1500);

// Find and click a user row
const rows = await page.$$("table tr");
console.log(`Found ${rows.length} table rows`);
let clicked = false;
for (let i = 1; i < rows.length; i++) {
  const text = await rows[i].textContent();
  if (text && text.includes("@")) {
    const box = await rows[i].boundingBox();
    console.log(`Clicking row ${i}: "${(text||"").substring(0,50)}" at x=${box?.x}, y=${box?.y}`);
    await rows[i].click();
    clicked = true;
    break;
  }
}

if (!clicked) {
  console.log("No user row found, trying interactive elements");
  const interactive = await page.$$("[class*='interactive'], [class*='cursor-pointer']");
  if (interactive.length > 0) {
    await interactive[0].click();
    clicked = true;
  }
}

await page.waitForTimeout(1500);

// Take full-page screenshot
await page.screenshot({ path: "debug-drawer-open.png", fullPage: false });
console.log("Screenshot saved: debug-drawer-open.png");

// Dump full DOM tree with z-indices and positions of all key elements
const domDump = await page.evaluate(() => {
  function cls(el) { return el.getAttribute("class") || ""; }

  const results = [];

  // Collect all portaled elements (direct children of body)
  for (let i = 0; i < document.body.children.length; i++) {
    const el = document.body.children[i];
    const s = getComputedStyle(el);
    const c = cls(el);
    const r = el.getBoundingClientRect();
    if (s.position === "fixed" || s.zIndex !== "auto" || c.includes("z-") || c.includes("drawer") || c.includes("modal")) {
      results.push({
        tag: el.tagName,
        classes: c.substring(0, 120),
        pos: s.position,
        z: s.zIndex,
        rect: { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 },
        kids: el.children.length,
      });
    }
  }

  // All elements with explicit z-index > 0
  function getZ(el) { try { return parseInt(getComputedStyle(el).zIndex); } catch(e) { return 0; } }
  const zEls = [];
  const allNodes = document.querySelectorAll("*");
  for (const el of allNodes) {
    const z = getZ(el);
    if (z > 0 && el.getBoundingClientRect().width > 0) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      zEls.push({
        tag: el.tagName,
        cls: cls(el).substring(0, 60),
        z,
        pos: s.position,
        xfrm: s.transform !== "none",
        rect: { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 },
      });
    }
    if (zEls.length > 60) break;
  }

  // Container-type elements
  const containers = [];
  for (const el of allNodes) {
    const s = getComputedStyle(el);
    if (s.containerType !== "normal") {
      const r = el.getBoundingClientRect();
      containers.push({
        tag: el.tagName,
        cls: cls(el).substring(0, 60),
        ct: s.containerType,
        rect: { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 },
      });
    }
    if (containers.length > 20) break;
  }

  return { bodyChildren: results, zElements: zEls, contained: containers };
});

console.log("\n=== BODY CHILDREN (portaled/fixed elements) ===");
for (const c of domDump.bodyChildren) {
  console.log(`  <${c.tag}> class="${c.classes}" pos=${c.position} z=${c.zIndex} rect=(${c.rect.x},${c.rect.y}) ${c.rect.w}x${c.rect.h} children=${c.children}`);
}

console.log("\n=== Z-INDEX ELEMENTS (z > 0) ===");
for (const z of domDump.zElements) {
  console.log(`  <${z.tag}> z=${z.zIndex} pos=${z.position} class="${z.classes}" rect=(${z.rect.x},${z.rect.y}) ${z.rect.w}x${z.rect.h}${z.transform ? " transform" : ""}`);
}

console.log("\n=== STACKING CONTEXT ELEMENTS ===");
for (const s of domDump.stackingElements) {
  console.log(`  <${s.tag}> pos=${s.position} z=${s.zIndex} class="${s.classes}" rect=(${s.rect.x},${s.rect.y}) ${s.rect.w}x${s.rect.h}${s.transform?" transform":""}${s.filter?" filter":""}`);
}

console.log("\n=== CSS CONTAINMENT ELEMENTS ===");
for (const c of domDump.containElements) {
  console.log(`  <${c.tag}> container-type=${c.containerType} class="${c.classes}" rect=(${c.rect.x},${c.rect.y}) ${c.rect.w}x${c.rect.h}`);
}

await browser.close();
