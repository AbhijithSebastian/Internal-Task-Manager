const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('login')) {
      console.log(`RESP: ${resp.status()} ${resp.statusText()} ${url.substring(0,80)}`);
      if (resp.status() >= 400) {
        resp.text().then(t => console.log(`  Body: ${t.substring(0,200)}`));
      }
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`CONSOLE ERR: ${msg.text()}`);
  });

  console.log('=== Employee login debug ===');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.waitForTimeout(1000);

  await page.fill('#email', 'employee@internaltool.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log(`URL: ${page.url()}`);

  // If still on login, check for error
  if (page.url().includes('login')) {
    const html = await page.content();
    // Find errors in the Inertia page data - try both quote styles
    const match = html.match(/data-page="([^"]+)"/);
    const match2 = html.match(/data-page='([^']+)'/);
    const m = match || match2;
    if (m) {
      try {
        const data = JSON.parse(decodeURIComponent(m[1]));
        console.log('Inertia errors:', JSON.stringify(data.props?.errors));
        console.log('Inertia flash:', JSON.stringify(data.props?.flash));
      } catch(e) {
        console.log('Parse error:', e.message);
      }
    } else {
      console.log('No data-page found in HTML');
    }
    console.log('Last 100 chars of page:', html.substring(html.length - 100));
    
    // Look at data-page raw
    const dpStart = html.indexOf('data-page="');
    if (dpStart > 0) {
      const raw = html.substring(dpStart, dpStart + 300);
      console.log('Raw data-page (300 chars):', raw.substring(0,300));
    }
  }

  await browser.close();
})();
