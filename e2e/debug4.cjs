const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ text: msg.text(), loc: msg.location() });
    }
  });
  page.on('pageerror', err => {
    errors.push({ text: err.message, stack: err.stack });
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  console.log('JS Errors:', errors.length);
  for (const e of errors) {
    console.log(`  [${e.loc?.url?.split('/').pop() || ''}] ${e.text}`);
  }

  // Check if app div has data-page (Inertia rendered)
  const hasDataPage = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app ? app.hasAttribute('data-page') : false;
  });
  console.log('Has Inertia data-page:', hasDataPage);

  // Check for Vue app
  const vueMounted = await page.evaluate(() => {
    return !!(document.getElementById('app')?.__vue_app__);
  });
  console.log('Vue mounted:', vueMounted);

  // Try targeting by role or placeholder
  const emailInput = await page.locator('input[type="email"]').isVisible();
  console.log('Email input visible:', emailInput);

  await browser.close();
})();
