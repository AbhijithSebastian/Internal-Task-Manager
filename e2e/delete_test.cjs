const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });

  async function login(page, email) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.fill('#email', email);
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (url.includes('login')) throw new Error(`Login failed for ${email} (${url})`);
  }

  // Use super admin
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, 'abhijith@internaltool.com');
  console.log('Logged in as super admin');

  // TEST: Delete button on Project Show
  console.log('\n=== Project Show ===');
  await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Click first project
  const firstProjectLink = await page.locator('a:has-text("Jovexa"), a:has-text("Project"), h2 a, td a').first().isVisible().catch(() => false);
  console.log(`Project list has links: ${firstProjectLink}`);

  // Just go directly to project/1
  await page.goto(`${BASE}/projects/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const deleteBtn = await page.locator('button:has-text("Delete")').first().isVisible().catch(() => false);
  console.log(`Delete button on project/1: ${deleteBtn}`);

  if (deleteBtn) {
    await page.locator('button:has-text("Delete")').click();
    await page.waitForTimeout(500);
    // Check ConfirmDialog appeared
    const dialog = await page.locator('[role="dialog"], .confirm-dialog, .fixed.inset-0').first().isVisible().catch(() => false);
    console.log(`Confirm dialog appeared: ${dialog}`);
  }

  // TEST: Delete button on Task Show
  console.log('\n=== Task Show ===');
  await page.goto(`${BASE}/tasks/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const taskDeleteBtn = await page.locator('button:has-text("Delete")').first().isVisible().catch(() => false);
  console.log(`Delete button on task/1: ${taskDeleteBtn}`);

  // TEST: Delete button on User Show
  console.log('\n=== User Show ===');
  await page.goto(`${BASE}/users/5`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const userDeleteBtn = await page.locator('button:has-text("Delete")').first().isVisible().catch(() => false);
  console.log(`Delete button on user/5: ${userDeleteBtn}`);

  // TEST: Find existing comments on a task
  console.log('\n=== Comments ===');
  await page.goto(`${BASE}/tasks/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const commentDeleteBtns = await page.locator('button:has-text("Delete")').all();
  console.log(`Total delete buttons on task: ${commentDeleteBtns.length}`);

  // List what buttons exist
  const allBtns = await page.locator('button').all();
  const btnTexts = [];
  for (const btn of allBtns) {
    const text = await btn.textContent().catch(() => '');
    if (text.trim()) btnTexts.push(text.trim());
  }
  console.log(`All buttons: ${btnTexts.join(', ')}`);

  await browser.close();
  console.log('\n=== DONE ===');
})();
