import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:80/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(500);
if (page.url().includes('login')) {
  await page.fill('input[type="email"], input[name="email"]', 'admin@company.com');
  await page.fill('input[type="password"], input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);
}
await page.goto('http://localhost:80/work/users', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1500);

const rows = await page.locator('table tr').all();
for (let i = 1; i < rows.length; i++) {
  const text = await rows[i].textContent();
  if (text && text.includes('@')) { await rows[i].click(); break; }
}
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  // Check the body's direct children
  const bodyChildren = Array.from(document.body.children);
  const result = {};

  // Find all fixed or absolute positioned elements
  const allElements = document.querySelectorAll('*');
  const positioned = [];
  for (const el of allElements) {
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || s.zIndex !== 'auto') {
      const tag = el.tagName.toLowerCase();
      const cls = el.getAttribute('class')?.substring(0, 50) || '';
      const id = el.getAttribute('id') || '';
      positioned.push({
        tag,
        id,
        class: cls,
        pos: s.position,
        z: s.zIndex,
        transform: s.transform,
        rect: el.getBoundingClientRect(),
      });
    }
  }

  // Check what's at specific pixel coordinates
  const points = {};
  for (const x of [0, 50, 100, 200, 239, 240, 241, 300, 500, 879, 880]) {
    const el = document.elementFromPoint(x, 450);
    if (el) {
      const s = getComputedStyle(el);
      points[`x=${x}`] = {
        tag: el.tagName.toLowerCase(),
        class: el.getAttribute('class')?.substring(0, 60) || '',
        position: s.position,
        zIndex: s.zIndex,
        bgColor: s.backgroundColor,
      };
    }
  }

  return {
    childCount: bodyChildren.length,
    childTags: Array.from(bodyChildren).map(c => c.tagName.toLowerCase() + (c.getAttribute('class')?.substring(0,30) || '')),
    positionedElements: positioned.slice(0, 20),
    points,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
