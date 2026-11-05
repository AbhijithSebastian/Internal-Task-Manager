import { chromium } from "playwright";
import { readFileSync } from "fs";
import { createCanvas, loadImage } from "canvas";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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
await page.goto("http://localhost:80/work/users", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(1500);

// Take baseline screenshot
await page.screenshot({ path: "debug-before.png", fullPage: false });

// Open drawer
const rows = await page.$$("table tr");
for (let i = 1; i < rows.length; i++) {
  const text = await rows[i].textContent();
  if (text && text.includes("@")) {
    await rows[i].click();
    break;
  }
}
await page.waitForTimeout(1500);

// Take screenshot with drawer open
await page.screenshot({ path: "debug-after.png", fullPage: false });

// Now analyze both images
const img1 = await loadImage("debug-before.png");
const img2 = await loadImage("debug-after.png");

const c1 = createCanvas(img1.width, img1.height);
const ctx1 = c1.getContext("2d");
ctx1.drawImage(img1, 0, 0);

const c2 = createCanvas(img2.width, img2.height);
const ctx2 = c2.getContext("2d");
ctx2.drawImage(img2, 0, 0);

const w = img1.width;
const h = img1.height;

function getPixel(ctx, x, y) {
  const d = ctx.getImageData(x, y, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], a: d[3] };
}

function isLight(r, g, b, threshold = 200) {
  return (r + g + b) / 3 > threshold;
}

function isWhite(r, g, b, threshold = 240) {
  return r > threshold && g > threshold && b > threshold;
}

console.log("\n=== PIXEL ANALYSIS ===");

// Scan horizontal line at y=450, look for light/white transitions
console.log("\n--- Horizontal scan at y=450 (after drawer open) ---");
let prevPixel = null;
const lines = [];
for (let x = 0; x < w; x++) {
  const p = getPixel(ctx2, x, 450);
  if (prevPixel) {
    const diff = Math.abs(p.r - prevPixel.r) + Math.abs(p.g - prevPixel.g) + Math.abs(p.b - prevPixel.b);
    if (diff > 80 && isWhite(p.r, p.g, p.b, 200)) {
      lines.push({ x, rgb: `(${p.r},${p.g},${p.b})`, diff });
    }
  }
  prevPixel = p;
}

// Group consecutive pixels into lines
const groupedLines = [];
let currentLine = null;
for (const l of lines) {
  if (!currentLine || l.x > currentLine.endX + 2) {
    currentLine = { startX: l.x, endX: l.x, rgb: l.rgb, pixels: [l] };
    groupedLines.push(currentLine);
  } else {
    currentLine.endX = l.x;
    currentLine.pixels.push(l);
  }
}

console.log(`Found ${groupedLines.length} light line segments at y=450:`);
for (const l of groupedLines) {
  console.log(`  x=${l.startX}-${l.endX} (${l.endX - l.startX + 1}px wide) color=${l.pixels[0].rgb}`);
}

// Check specific coordinates for light pixels
console.log("\n--- Key pixel colors (after) ---");
const keyX = [0, 239, 240, 241, 300, 500, 879, 880, 881, 900, 1100, 1300, 1439];
for (const x of keyX) {
  const p = getPixel(ctx2, x, 450);
  console.log(`  (${x}, 450): rgb(${p.r},${p.g},${p.b}) brightness=${((p.r+p.g+p.b)/3).toFixed(0)}`);
}

// Compare before/after at key points to see what changed
console.log("\n--- Before vs After color comparison ---");
const compareX = [240, 500, 880, 1100];
for (const x of compareX) {
  const before = getPixel(ctx1, x, 450);
  const after = getPixel(ctx2, x, 450);
  const diff = Math.abs(after.r - before.r) + Math.abs(after.g - before.g) + Math.abs(after.b - before.b);
  console.log(`  x=${x}: before=rgb(${before.r},${before.g},${before.b}) after=rgb(${after.r},${after.g},${after.b}) diff=${diff}`);
}

// Look for the drawer's left border specifically
console.log("\n--- Drawer left border investigation (y=450) ---");
for (let x = 875; x <= 885; x++) {
  const p = getPixel(ctx2, x, 450);
  console.log(`  x=${x}: rgb(${p.r},${p.g},${p.b}) brightness=${((p.r+p.g+p.b)/3).toFixed(0)}`);
}

// Check the backdrop effect - how much does it dim the page?
console.log("\n--- Backdrop dimming effect ---");
const contentBefore = getPixel(ctx1, 500, 450);
const contentAfter = getPixel(ctx2, 500, 450);
console.log(`Content (500,450): before=rgb(${contentBefore.r},${contentBefore.g},${contentBefore.b}) after=rgb(${contentAfter.r},${contentAfter.g},${contentAfter.b})`);

console.log("\n--- Vertical scan at x=880 (drawer edge) ---");
for (let y = 0; y < h; y += 50) {
  const p = getPixel(ctx2, 880, y);
  console.log(`  y=${y}: rgb(${p.r},${p.g},${p.b}) brightness=${((p.r+p.g+p.b)/3).toFixed(0)}`);
}

await browser.close();
