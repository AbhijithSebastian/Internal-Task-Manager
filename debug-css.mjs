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

const cssInfo = await page.evaluate(() => {
  // Find all CSS rules related to border-subtle
  const results = [];
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        if (r.cssText && (r.cssText.includes('border-subtle') || r.cssText.includes('border-default'))) {
          results.push({
            index: i,
            css: r.cssText.substring(0, 120),
            selector: r.selectorText,
          });
        }
      }
    } catch(e) {
      results.push({ error: String(e).substring(0, 80) });
    }
  }
  return results;
});
console.log(JSON.stringify(cssInfo, null, 2));
await browser.close();
