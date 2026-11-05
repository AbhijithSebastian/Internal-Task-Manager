import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", msg => { if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text()); });
page.on("response", r => { if (r.status() >= 400) console.log("HTTP ERROR:", r.status(), r.url()); });

async function login() {
  await page.goto("http://localhost:80/dashboard", { waitUntil: "networkidle" });
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

// ========== ROLES ==========
console.log("=== ROLES ===");
await page.goto("http://localhost:80/work/admin/roles", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(2000);
console.log("URL:", page.url());

// List all clickable cards
const cards = await page.$$("[class*='card'], [class*='Card'], [class*='interactive']");
console.log("Cards found:", cards.length);
for (let i = 0; i < cards.length; i++) {
  const text = await cards[i].textContent();
  console.log("Card", i, ":", (text || "").substring(0, 60).replace(/\n/g, " "));
}

// Try clicking first card
if (cards.length > 0) {
  console.log("\nClicking card 0...");
  await cards[0].click();
  await page.waitForTimeout(1500);
  
  // Check body last child
  console.log("Body children count:", await page.evaluate(() => document.body.children.length));
  const lastChild = await page.evaluate(() => {
    const lc = document.body.lastElementChild;
    return lc ? lc.className : "none";
  });
  console.log("Last child class:", lastChild);
  
  // Check for any z-drawer elements
  const zDrawerEls = await page.$$("[class*='z-drawer']");
  console.log("z-drawer elements:", zDrawerEls.length);
  for (let i = 0; i < zDrawerEls.length; i++) {
    const cl = await zDrawerEls[i].getAttribute("class");
    const box = await zDrawerEls[i].boundingBox();
    console.log("  z-drawer", i, ":", cl?.substring(0, 100), "box:", JSON.stringify(box));
  }
  
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
}

// ========== MEETINGS ==========
console.log("\n\n=== MEETINGS ===");
await page.goto("http://localhost:80/work/meetings", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(2000);
console.log("URL:", page.url());

const meetingCards = await page.$$("[class*='card'], [class*='Card'], tr, [class*='interactive']");
console.log("Cards found:", meetingCards.length);
for (let i = 0; i < Math.min(3, meetingCards.length); i++) {
  const text = await meetingCards[i].textContent();
  console.log("Card", i, ":", (text || "").substring(0, 60).replace(/\n/g, " "));
}

if (meetingCards.length > 0) {
  console.log("\nClicking card 0...");
  try {
    await meetingCards[0].click();
    await page.waitForTimeout(1500);
    
    const zDrawerEls = await page.$$("[class*='z-drawer']");
    console.log("z-drawer elements:", zDrawerEls.length);
    for (let i = 0; i < zDrawerEls.length; i++) {
      const box = await zDrawerEls[i].boundingBox();
      console.log("  z-drawer", i, "box:", JSON.stringify(box));
    }
    
    const slideIn = await page.$("[class*='slide-in-right']");
    console.log("Slide-in panel:", slideIn ? "found" : "not found");
    
    await page.keyboard.press("Escape");
  } catch (e) {
    console.log("Click error:", e.message.substring(0, 100));
  }
}

// ========== ANNOUNCEMENTS ==========
console.log("\n\n=== ANNOUNCEMENTS ===");
await page.goto("http://localhost:80/work/announcements", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(2000);
console.log("URL:", page.url());

const annCards = await page.$$("[class*='card'], [class*='Card'], a[href*='announcement'], [class*='interactive']");
console.log("Cards found:", annCards.length);
for (let i = 0; i < Math.min(3, annCards.length); i++) {
  const text = await annCards[i].textContent();
  console.log("Card", i, ":", (text || "").substring(0, 60).replace(/\n/g, " "));
}

if (annCards.length > 0) {
  console.log("\nClicking card 0...");
  try {
    await annCards[0].click();
    await page.waitForTimeout(1500);
    
    const zDrawerEls = await page.$$("[class*='z-drawer']");
    console.log("z-drawer elements:", zDrawerEls.length);
    for (let i = 0; i < zDrawerEls.length; i++) {
      const box = await zDrawerEls[i].boundingBox();
      console.log("  z-drawer", i, "box:", JSON.stringify(box));
    }
    
    const slideIn = await page.$("[class*='slide-in-right']");
    console.log("Slide-in panel:", slideIn ? "found" : "not found");
    
    await page.keyboard.press("Escape");
  } catch (e) {
    console.log("Click error:", e.message.substring(0, 100));
  }
}

await browser.close();
