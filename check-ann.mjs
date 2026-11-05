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

await page.goto("http://localhost:80/work/announcements", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(2000);
console.log("URL:", page.url());

// List all elements with interactive class
const interactiveEls = await page.$$("[class*='interactive']");
console.log("Interactive elements:", interactiveEls.length);
for (let i = 0; i < interactiveEls.length; i++) {
  const tag = await interactiveEls[i].evaluate(el => el.tagName);
  const cl = await interactiveEls[i].getAttribute("class");
  const text = await interactiveEls[i].textContent();
  console.log(`  [${i}] <${tag}> class="${cl?.substring(0,80)}" text="${(text||"").substring(0,60).replace(/\n/g," ")}"`);
}

// List all cards
const cards = await page.$$("[class*='card'], [class*='Card']");
console.log("\nCard elements:", cards.length);
for (let i = 0; i < cards.length; i++) {
  const tag = await cards[i].evaluate(el => el.tagName);
  const cl = await cards[i].getAttribute("class");
  const text = await cards[i].textContent();
  console.log(`  [${i}] <${tag}> class="${cl?.substring(0,80)}" text="${(text||"").substring(0,60).replace(/\n/g," ")}"`);
}

// Try clicking interactive card
if (interactiveEls.length > 0) {
  console.log("\nClicking interactive[0]...");
  await interactiveEls[0].click();
  await page.waitForTimeout(1500);
  
  // Check for drawer
  const slideIn = await page.$("[class*='animate-slide-in-right']");
  console.log("Slide-in panel:", slideIn ? "found" : "not found");
  
  const drawers = await page.$$("[class*='z-drawer']");
  console.log("z-drawer elements:", drawers.length);
  for (let i = 0; i < drawers.length; i++) {
    const cl = await drawers[i].getAttribute("class");
    const box = await drawers[i].boundingBox();
    console.log(`  [${i}] class="${cl?.substring(0,80)}" box=${JSON.stringify(box)}`);
  }
  
  const portal = await page.$("body > div:last-child");
  if (portal) {
    const cl = await portal.getAttribute("class");
    const innerHTML = await portal.evaluate(el => el.innerHTML.substring(0, 300));
    console.log(`Body last child class="${cl}" html="${innerHTML}"`);
  }
}

await browser.close();
