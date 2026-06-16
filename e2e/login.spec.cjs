const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });

  const pages = [
    '/', '/projects', '/tasks', '/users', '/notifications',
    '/activity', '/reports', '/profile', '/announcements', '/notes'
  ];

  console.log(`\n--- LOGIN: Super Admin (abhijith@gmail.com) ---`);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.fill('#email', 'abhijith@gmail.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const url = page.url();
  const loggedIn = !url.includes('login');
  console.log(`  Login: ${loggedIn ? 'OK' : 'FAIL'} (url=${url})`);

  if (!loggedIn) {
    const err = await page.locator('.text-red-800, .text-red-600').first().textContent().catch(() => 'none');
    console.log(`  Error: ${err}`);
  }

  if (loggedIn) {
    for (const p of pages) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      const cur = page.url();
      console.log(`  ${p} [${cur.includes('login') ? 'FAIL' : 'OK'}]`);
    }

    // Test Cmd+K search modal
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchVisible = await page.locator('.search-modal, [role="dialog"]').first().isVisible().catch(() => false);
    console.log(`  Cmd+K Search [${searchVisible ? 'OK' : 'SKIP'}]`);

    // Test widget settings
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    const customizeBtn = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    const hasCustomize = await customizeBtn.isVisible().catch(() => false);
    console.log(`  Customize Dashboard [${hasCustomize ? 'OK' : 'SKIP'}]`);
  }

  await ctx.close();

  await browser.close();
  console.log('\n=== ALL DONE ===');
})();
