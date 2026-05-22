const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });

  const users = [
    { role: 'Admin', email: 'admin@internaltool.com' },
    { role: 'PM', email: 'pm@internaltool.com' },
    { role: 'Lead', email: 'lead@internaltool.com' },
    { role: 'Employee', email: 'employee@internaltool.com' },
  ];

  const pages = ['/', '/projects', '/tasks', '/users', '/notifications', '/activity', '/reports', '/profile'];

  for (const user of users) {
    console.log(`\n--- LOGIN: ${user.role} (${user.email}) ---`);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.fill('#email', user.email);
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
    }

    await ctx.close();
  }

  await browser.close();
  console.log('\n=== ALL DONE ===');
})();
