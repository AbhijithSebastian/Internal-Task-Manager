const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForSelector('#email', { timeout: 10000 });

  await page.fill('#email', 'admin@internaltool.com');
  await page.fill('#password', 'password');
  await page.screenshot({ path: '/tmp/before_submit.png' });

  // Click submit and wait
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/after_submit.png' });

  console.log('Current URL:', page.url());
  const html = await page.content();
  console.log('Page content snippet:', html.substring(0, 500));

  await browser.close();
})();
