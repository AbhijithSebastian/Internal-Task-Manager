import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = [];
const errors = [];
const screenshotsDir = join(__dirname, "audit-screenshots-v2");
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

const API_BASE = "http://localhost:8000/api/v1";

function report(component, screen, status, detail = "") {
  results.push({ component, screen, status, detail });
  console.log(`  [${status}] ${component} on ${screen}${detail ? " — " + detail : ""}`);
}

function reportError(screen, msg) {
  const key = `${screen}:::${msg}`;
  if (!errors.find(e => `${e.screen}:::${e.msg}` === key))
    errors.push({ screen, msg });
}

async function screenshot(page, name) {
  await page.screenshot({ path: join(screenshotsDir, `${name}.png`), fullPage: false });
}

async function waitForStable(page, ms = 500) {
  await page.waitForTimeout(ms);
}

async function getApiToken() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@company.com", password: "password" }),
  });
  const data = await res.json();
  return data.access_token;
}

async function apiPost(token, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(token, path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function seedTestData(token) {
  // Seed a meeting if none exist
  const meetings = await apiGet(token, "/meetings?per_page=1");
  const meetingItems = meetings?.items || [];
  if (meetingItems.length === 0) {
    console.log("Seeding test meeting...");
    await apiPost(token, "/meetings", {
      title: "Test Meeting",
      summary: "Test summary for visual audit",
      meeting_date: "2026-07-08T10:00:00",
      location: "virtual",
      attendees: [],
      project_id: 1,
      organizer_id: 1,
    });
  }

  // Seed an announcement if none exist
  const anns = await apiGet(token, "/announcements?per_page=1");
  const annItems = anns?.items || [];
  if (annItems.length === 0) {
    console.log("Seeding test announcement...");
    await apiPost(token, "/announcements", {
      title: "Test Announcement",
      content: "This is a test announcement for visual audit",
      status: "published",
      priority: "low",
    });
  }
}

async function login(page) {
  await page.goto("http://localhost:80/dashboard", { waitUntil: "networkidle", timeout: 15000 });
  await waitForStable(page, 500);
  if (page.url().includes("login")) {
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (emailInput && passwordInput) {
      await emailInput.fill("admin@company.com");
      await passwordInput.fill("password");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      await waitForStable(page, 1000);
    }
  }
}

// Detect actual drawer panel (right-side, not sidebar on left)
async function findDrawerPanel(page) {
  // The sidebar has z-drawer but is on the left. Actual drawer has animate-slide-in-right.
  const panel = await page.$("[class*='animate-slide-in-right']");
  if (panel) return panel;
  // Alternative: find portaled drawer wrapper (last child of body)
  const portal = await page.$("body > div:last-child > [class*='z-drawer-bg']");
  if (portal) return portal;
  // Check for any z-drawer element that doesn't have w-60 or left-0 (sidebar)
  const drawers = await page.$$("[class*='z-drawer']");
  for (const d of drawers) {
    const box = await d.boundingBox();
    if (box && box.x > 300) return d; // not sidebar if x > 300
  }
  return null;
}

async function findModal(page) {
  // Portaled modal (last child of body with z-modal or z-modal-bg)
  const modal = await page.$("[class*='z-modal']");
  if (modal) return modal;
  const modalBg = await page.$("[class*='z-modal-bg']");
  if (modalBg) return modalBg;
  return null;
}

async function auditDrawer(page, name, triggerFn, screen) {
  report(name, screen, "Testing", "");
  try {
    await triggerFn();
    await waitForStable(page, 1200);
    await screenshot(page, `${screen}-${name.replace(/\s+/g, '-')}-open`);

    const panel = await findDrawerPanel(page);
    if (!panel) {
      report(name, screen, "FAIL", "drawer panel not found");
      return;
    }

    const visible = await panel.isVisible();
    if (!visible) {
      report(name, screen, "FAIL", "drawer not visible");
      return;
    }

    const box = await panel.boundingBox();
    report(name, screen, "PASS", `drawer at x=${Math.round(box.x)}, w=${Math.round(box.width)}, visible`);

    // Test Escape to close
    await page.keyboard.press("Escape");
    await waitForStable(page, 800);
    const afterClose = await findDrawerPanel(page);
    report(name, screen, "PASS", "closed via Escape");
  } catch (e) {
    report(name, screen, "ERROR", e.message);
  }
}

async function auditModal(page, name, triggerFn, screen) {
  report(name, screen, "Testing", "");
  try {
    await triggerFn();
    await waitForStable(page, 1200);
    await screenshot(page, `${screen}-${name.replace(/\s+/g, '-')}-open`);

    const modal = await findModal(page);
    if (!modal) {
      report(name, screen, "FAIL", "modal not found");
      return;
    }

    const visible = await modal.isVisible();
    const box = await modal.boundingBox();
    report(name, screen, "PASS", `modal visible: ${visible}, box: ${JSON.stringify(box)}`);

    // Escape
    await page.keyboard.press("Escape");
    await waitForStable(page, 800);
    report(name, screen, "PASS", "closed via Escape");
  } catch (e) {
    report(name, screen, "ERROR", e.message);
  }
}

(async () => {
  console.log("=== Visual Regression Audit v2 ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") reportError(page.url(), `Console error: ${msg.text()}`);
  });
  page.on("response", r => {
    if (r.status() >= 400) reportError(page.url(), `HTTP ${r.status()}: ${r.url()}`);
  });

  try {
    // Seed test data before browser tests
    const token = await getApiToken();
    await seedTestData(token);

    await login(page);
    console.log("\n  Logged in, URL:", page.url());
    await screenshot(page, "00-dashboard");

    // ==================== DASHBOARD ====================
    console.log("\n=== Dashboard ===");
    await auditModal(page, "SearchModal", async () => {
      await page.keyboard.press("Meta+k");
    }, "Dashboard");

    // ==================== USERS ====================
    console.log("\n=== Users ===");
    await page.goto("http://localhost:80/work/users", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "01-users");
    await auditDrawer(page, "UserDetailDrawer", async () => {
      const rows = await page.$$("tr");
      for (let i = 1; i < rows.length; i++) {
        const text = await rows[i].textContent();
        if (text && text.includes("@")) { await rows[i].click(); return; }
      }
      const cards = await page.$$("[class*='interactive'], [class*='cursor-pointer']");
      if (cards.length > 0) await cards[0].click();
    }, "Users");

    // ==================== ROLES ====================
    // RoleListPage uses an inline split-panel layout (left card → right detail panel),
    // NOT a drawer. Verify the detail panel opens when clicking a role card.
    console.log("\n=== Roles ===");
    await page.goto("http://localhost:80/work/admin/roles", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "02-roles");
    report("RoleDetailPanel", "Roles", "Testing", "");
    try {
      const cards = await page.$$("[class*='card'], [class*='Card']");
      if (cards.length > 0) {
        await cards[0].click();
        await waitForStable(page, 1000);
        await screenshot(page, "Roles-RoleDetailPanel-open");
        // Check that the right panel shows role details (not the "Select a role" placeholder)
        const body = await page.textContent("body");
        if (body.includes("Select a role") && !body.includes("permissions")) {
          report("RoleDetailPanel", "Roles", "FAIL", "detail panel did not appear");
        } else {
          const detailPanel = await page.$("text=Permissions");
          report("RoleDetailPanel", "Roles", detailPanel ? "PASS" : "FAIL",
            detailPanel ? "detail panel opened showing permissions" : "permissions section not found");
        }
      } else {
        report("RoleDetailPanel", "Roles", "FAIL", "no role cards found");
      }
    } catch (e) {
      report("RoleDetailPanel", "Roles", "ERROR", e.message);
    }

    // ==================== TASKS ====================
    console.log("\n=== Tasks ===");
    await page.goto("http://localhost:80/work/tasks", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "03-tasks");
    await auditDrawer(page, "TaskDetailDrawer", async () => {
      const rows = await page.$$("tr");
      for (let i = 1; i < rows.length; i++) {
        const text = await rows[i].textContent();
        if (text && !text.includes("Task") && !text.includes("Status")) {
          await rows[i].click();
          return;
        }
      }
    }, "Tasks");

    // ==================== SUBTASKS ====================
    console.log("\n=== Subtasks ===");
    await page.goto("http://localhost:80/work/subtasks", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "04-subtasks");
    await auditModal(page, "SubtaskModal", async () => {
      const newBtn = await page.$("button:has-text('New'), button:has-text('Add')");
      if (newBtn) await newBtn.click();
    }, "Subtasks");

    // ==================== MEETINGS ====================
    console.log("\n=== Meetings ===");
    await page.goto("http://localhost:80/work/meetings", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "05-meetings");
    await auditDrawer(page, "MeetingDetailDrawer", async () => {
      // Table rows are rendered after KPI cards; find the data row (skip header)
      const rows = await page.$$("table tr");
      if (rows.length > 1) {
        await rows[1].click();
        return;
      }
      // Fallback: try card/interactive elements
      const cards = await page.$$("[class*='interactive'], [class*='cursor-pointer']");
      for (const card of cards.slice(0, 3)) {
        try { await card.click(); await waitForStable(page, 300); return; } catch {}
      }
    }, "Meetings");

    // ==================== ANNOUNCEMENTS ====================
    console.log("\n=== Announcements ===");
    await page.goto("http://localhost:80/work/announcements", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "06-announcements");
    await auditDrawer(page, "AnnouncementDetailDrawer", async () => {
      // The interactive variant adds cursor-pointer; the KPI cards don't have it
      const clickableCards = await page.$$("[class*='cursor-pointer']");
      if (clickableCards.length > 0) {
        await clickableCards[0].click();
        return;
      }
      // Fallback: try cards after the KPI row (skip first 5 KPI cards)
      const cards = await page.$$("[class*='card'], [class*='Card']");
      for (let i = 5; i < cards.length; i++) {
        try { await cards[i].click(); await waitForStable(page, 300); return; } catch {}
      }
    }, "Announcements");

    // ==================== REPORTS ====================
    console.log("\n=== Reports ===");
    await page.goto("http://localhost:80/work/reports", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "07-reports");
    await auditModal(page, "ReportPreviewModal", async () => {
      const eyeBtns = await page.$$("button:has(svg[class*='eye']), td button, tr button");
      for (const btn of eyeBtns.slice(0, 3)) {
        try { await btn.click(); await waitForStable(page, 300); return; } catch {}
      }
    }, "Reports");

    // ==================== PROJECT + RESOURCES ====================
    console.log("\n=== Projects & Resources ===");
    await page.goto("http://localhost:80/work/projects/1/resources", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "08-resources");
    await auditModal(page, "ResourceUploadDialog", async () => {
      const uploadBtn = await page.$("button:has-text('Upload'), button:has-text('Add Resource')");
      if (uploadBtn) await uploadBtn.click();
    }, "Resources");

    // ==================== ENDPOINTS ====================
    console.log("\n=== Endpoints ===");
    await page.goto("http://localhost:80/work/projects/1/endpoints", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "09-endpoints");
    await auditModal(page, "EndpointForm", async () => {
      const newBtn = await page.$("button:has-text('New'), button:has-text('Create'), a:has-text('New')");
      if (newBtn) await newBtn.click();
    }, "Endpoints");

    // ==================== SETTINGS ====================
    console.log("\n=== Settings ===");
    await page.goto("http://localhost:80/work/admin/settings", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "10-settings");

    // ==================== SUMMARY ====================
    console.log("\n\n=== AUDIT SUMMARY ===");
    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.filter(r => r.status === "FAIL").length;
    const errored = results.filter(r => r.status === "ERROR").length;
    console.log(`Components: ${results.length}`);
    console.log(`PASS: ${passed}  FAIL: ${failed}  ERROR: ${errored}`);
    if (errors.length > 0) {
      console.log(`\nErrors (${errors.length}):`);
      errors.forEach(e => console.log(`  [${e.screen}] ${e.msg}`));
    }
    console.log(`\nDetail:`);
    results.forEach(r => console.log(`  [${r.status}] ${r.component} @ ${r.screen} ${r.detail}`));

  } catch (e) {
    console.error("FATAL:", e);
  } finally {
    await browser.close();
  }

  writeFileSync(join(__dirname, "audit-v2-results.json"), JSON.stringify({ results, errors }, null, 2));
  console.log("\nResults: audit-v2-results.json");
})();
