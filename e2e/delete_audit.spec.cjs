const { chromium } = require('playwright');
const BASE = 'http://localhost:8911';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  async function loginAs(email) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.fill('#email', email);
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const ok = !page.url().includes('login');
    if (!ok) throw new Error(`Login failed for ${email}`);
    return ok;
  }

  async function checkPage(url, expectedContent) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const html = await page.content();
    const found = expectedContent ? html.includes(expectedContent) : true;
    console.log(`  ${url} [${page.url().includes('login') ? 'FAIL' : 'OK'}] contentCheck=${found}`);
    return !page.url().includes('login') && found;
  }

  console.log('=== TEST 1: Admin login ===');
  await loginAs('admin@internaltool.com');

  console.log('\n=== TEST 2: Delete buttons exist on Project Show ===');
  await page.goto(`${BASE}/projects/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const projectPageHTML = await page.content();
  const hasDeleteBtn = projectPageHTML.includes('Delete') || projectPageHTML.includes('delete') || projectPageHTML.includes('trash');
  console.log(`  Delete button found: ${hasDeleteBtn}`);
  // Check what buttons exist
  const buttons = await page.locator('button, a[class*="btn"]').all();
  console.log(`  Buttons found: ${buttons.length}`);
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => '');
    if (text.trim()) console.log(`    ${text.trim()}`);
  }

  console.log('\n=== TEST 3: Delete buttons on Task Show ===');
  await page.goto(`${BASE}/tasks/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const taskPageHTML = await page.content();
  const taskHasDelete = taskPageHTML.includes('Delete') || taskPageHTML.includes('delete') || taskPageHTML.includes('trash');
  console.log(`  Delete button found: ${taskHasDelete}`);

  console.log('\n=== TEST 4: Delete buttons on User Show ===');
  await page.goto(`${BASE}/users/2`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const userPageHTML = await page.content();
  const userHasDelete = userPageHTML.includes('Delete') || userPageHTML.includes('delete') || userPageHTML.includes('trash');
  console.log(`  Delete button found: ${userHasDelete}`);

  console.log('\n=== TEST 5: Comments delete (on Task Show) ===');
  await page.goto(`${BASE}/tasks/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const hasCommentDelete = await page.locator('button:has-text("Delete"), [class*="delete"]').first().isVisible().catch(() => false);
  console.log(`  Comment delete visible: ${hasCommentDelete}`);

  console.log('\n=== TEST 6: Subtask actions ===');
  const hasSubtaskUI = await page.locator('[class*="subtask"], [class*="Subtask"]').first().isVisible().catch(() => false);
  console.log(`  Subtask UI visible: ${hasSubtaskUI}`);

  console.log('\n=== TEST 7: Attachment delete ===');
  const hasAttachmentUI = await page.locator('[class*="attachment"], [class*="file"]').first().isVisible().catch(() => false);
  console.log(`  Attachment UI visible: ${hasAttachmentUI}`);

  await browser.close();
  console.log('\n=== DONE ===');
})();
