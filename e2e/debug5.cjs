const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Capture ALL requests/responses
  page.on('request', req => {
    if (req.url().includes('login') || req.url().includes('dashboard')) {
      console.log(`REQ: ${req.method()} ${req.url().substring(0,80)}`);
      if (req.method() === 'POST') {
        const postData = req.postData();
        if (postData) console.log(`  Body: ${postData.substring(0,150)}`);
      }
    }
  });
  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('login') || url.includes('dashboard')) {
      console.log(`RES: ${resp.status()} ${resp.statusText()} ${url.substring(0,80)}`);
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`ERR: ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`PAGE_ERR: ${err.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('\n--- FILLING FORM ---');
  
  await page.fill('#email', 'admin@internaltool.com');
  await page.fill('#password', 'password');
  
  console.log('--- CLICKING SUBMIT ---');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(5000);
  console.log(`\nFinal URL: ${page.url()}`);
  console.log('--- DONE ---');

  await browser.close();
})();
