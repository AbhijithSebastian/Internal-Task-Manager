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

// Open drawer
const rows = await page.locator('table tr').all();
for (let i = 1; i < rows.length; i++) {
  const text = await rows[i].textContent();
  if (text && text.includes('@')) { await rows[i].click(); break; }
}
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  if (!aside) return { error: 'no aside' };
  const s = getComputedStyle(aside);

  // Check which z-drawer rule is actually applied
  const asideClass = aside.getAttribute('class');

  // Find the computed properties
  const zIndex = s.zIndex;
  const position = s.position;
  const transform = s.transform;
  const backgroundColor = s.backgroundColor;
  const borderRightColor = s.borderRightColor;
  const borderRightWidth = s.borderRightWidth;
  const willChange = s.willChange;
  const transition = s.transition;

  // Check which elements are at various x positions
  return {
    class: asideClass,
    position,
    zIndex,
    transform,
    backgroundColor,
    borderRightColor,
    borderRightWidth,
    willChange,
    transition,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
