const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto('http://localhost:8911/login', { waitUntil: 'networkidle', timeout: 30000 });
  // Wait for Vue to mount and render the form
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/login_page2.png', fullPage: true });
  
  // Find all input elements
  const inputs = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').all();
  console.log('Email inputs:', inputs.length);
  
  const allInputs = await page.locator('input').all();
  console.log('Total inputs:', allInputs.length);
  for (const inp of allInputs) {
    const name = await inp.getAttribute('name');
    const type = await inp.getAttribute('type');
    const placeholder = await inp.getAttribute('placeholder');
    const id = await inp.getAttribute('id');
    console.log(`  input name="${name}" type="${type}" placeholder="${placeholder}" id="${id}"`);
  }
  
  const buttons = await page.locator('button').all();
  console.log('Buttons:', buttons.length);
  for (const btn of buttons) {
    const text = await btn.textContent();
    const type = await btn.getAttribute('type');
    console.log(`  button type="${type}" text="${text.trim()}"`);
  }
  
  await browser.close();
})();
