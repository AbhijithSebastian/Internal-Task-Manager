const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('login')) {
      console.log(`Response: ${url} -> ${response.status()}`);
      console.log(`  Headers:`, JSON.stringify(response.headers()));
    }
  });

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  CONSOLE ERROR: ${msg.text()}`);
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForSelector('#email', { timeout: 10000 });

  // Use page.evaluate to check if Inertia is loaded
  const inertiaAvailable = await page.evaluate(() => {
    return typeof window._inertia !== 'undefined' || typeof window.Inertia !== 'undefined' || 'router' in window;
  });
  console.log('Inertia in window:', inertiaAvailable);

  await page.fill('#email', 'admin@internaltool.com');
  await page.fill('#password', 'password');

  console.log('Clicking submit...');
  await page.click('button[type="submit"]');
  
  // Wait for network to settle
  await page.waitForTimeout(3000);
  
  const html = await page.content();
  console.log('After submit, page length:', html.length);
  console.log('Current URL:', page.url());
  
  // Check if there's an error displayed
  const errorVisible = await page.locator('.text-red-600, .text-red-800, .bg-red-50').first().isVisible().catch(() => false);
  console.log('Error visible:', errorVisible);
  if (errorVisible) {
    const errorText = await page.locator('.text-red-600, .text-red-800').first().textContent();
    console.log('Error text:', errorText);
  }

  await browser.close();
})();
