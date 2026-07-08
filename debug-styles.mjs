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

const styles = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  const s = aside ? getComputedStyle(aside) : null;
  return {
    position: s?.position,
    zIndex: s?.zIndex,
    transform: s?.transform,
    transformStyle: s?.transformStyle,
    willChange: s?.willChange,
    borderRightWidth: s?.borderRightWidth,
    borderRightColor: s?.borderRightColor,
    borderRightStyle: s?.borderRightStyle,
    transition: s?.transition,
    elAt239: document.elementFromPoint(239, 450)?.getAttribute('class')?.substring(0,70),
    elAt240: document.elementFromPoint(240, 450)?.getAttribute('class')?.substring(0,70),
    elAt879: document.elementFromPoint(879, 450)?.getAttribute('class')?.substring(0,70),
    elAt880: document.elementFromPoint(880, 450)?.getAttribute('class')?.substring(0,70),
  };
});
console.log(JSON.stringify(styles, null, 2));
await browser.close();
