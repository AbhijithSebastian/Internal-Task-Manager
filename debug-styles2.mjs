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
  const fullClass = aside?.getAttribute('class') || 'no-aside';
  const s = aside ? getComputedStyle(aside) : null;
  
  // Find the border-subtle rule
  const borderColor = s?.borderRightColor;
  
  // Check if ANY rule defines border-subtle
  let borderSubtleRule = null;
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText?.includes('border-subtle')) {
          borderSubtleRule = {
            selector: rule.selectorText,
            css: rule.cssText,
          };
          break;
        }
      }
    } catch(e) {}
    if (borderSubtleRule) break;
  }

  return {
    fullClass,
    borderRightColor: borderColor,
    borderRightWidth: s?.borderRightWidth,
    borderRightStyle: s?.borderRightStyle,
    asideZIndex: s?.zIndex,
    asidePosition: s?.position,
    asideTransform: s?.transform,
    borderSubtleRule,
    // Check the computed color of --border-subtle
    borderSubtleVar: getComputedStyle(aside).getPropertyValue('--border-subtle'),
    borderDefaultVar: getComputedStyle(aside).getPropertyValue('--border-default'),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
