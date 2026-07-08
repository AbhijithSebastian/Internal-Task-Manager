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

const computed = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  if (!aside) return { error: 'no aside' };
  const s = getComputedStyle(aside);
  // Get all computed style properties related to bg, border, text
  return {
    backgroundColor: s.backgroundColor,
    color: s.color,
    borderRightColor: s.borderRightColor,
    borderRightWidth: s.borderRightWidth,
    // Check if bg-app rule exists
    bgAppRule: null,
  };
});

// Also check the CSS rule directly
const ruleCheck = await page.evaluate(() => {
  const results = {};
  // Search for .bg-app in all stylesheets
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText === '.bg-app') {
          results.bgAppRule = rule.cssText;
        }
        if (rule.selectorText === '.bg-bg-app') {
          results.bgBgAppRule = rule.cssText;
        }
        if (rule.selectorText === '.text-text-primary') {
          results.textTextPrimaryRule = rule.cssText;
        }
        if (rule.selectorText === '.bg-bg-surface') {
          results.bgBgSurfaceRule = rule.cssText;
        }
        // Find border-subtle variants
        if (rule.cssText?.includes('border-subtle') && rule.selectorText) {
          results['borderSubtleRule_' + rule.selectorText] = rule.cssText;
        }
      }
    } catch(e) {}
  }
  return results;
});

console.log('=== Computed ===');
console.log(JSON.stringify(computed, null, 2));
console.log('\n=== Rule Check ===');
console.log(JSON.stringify(ruleCheck, null, 2));

await browser.close();
