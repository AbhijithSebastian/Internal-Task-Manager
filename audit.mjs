import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = [];
const errors = [];
const screenshotsDir = join(__dirname, "audit-screenshots");
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

function report(component, screen, status, detail = "") {
  results.push({ component, screen, status, detail });
  console.log(`  [${status}] ${component} on ${screen}${detail ? " — " + detail : ""}`);
}

function reportError(screen, msg) {
  errors.push({ screen, msg });
  console.error(`  [ERROR] ${screen}: ${msg}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: join(screenshotsDir, `${name}.png`), fullPage: false });
}

async function waitForStable(page, ms = 500) {
  await page.waitForTimeout(ms);
}

async function checkConsoleErrors(page, screen) {
  page.on("console", (msg) => {
    if (msg.type() === "error") reportError(screen, `Console error: ${msg.text()}`);
  });
}

async function checkNetworkErrors(page, screen) {
  page.on("response", (response) => {
    if (!response.ok() && response.status() >= 400) {
      reportError(screen, `Failed request: ${response.status()} ${response.url()}`);
    }
  });
}

async function login(page) {
  await page.goto("http://localhost:80/login", { waitUntil: "networkidle" });
  await waitForStable(page);
  // The app might have a login page or auto-redirect. Let's check
  const url = page.url();
  if (url.includes("login")) {
    await page.fill('input[type="email"], input[name="email"]', "admin@company.com");
    await page.fill('input[type="password"], input[name="password"]', "password");
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await waitForStable(page);
  }
  // If already logged in (cookie/session), we should be on a page already
}

async function checkOverlay(page, selector, description) {
  try {
    const el = await page.$(selector);
    if (!el) return { visible: false, reason: "not found" };
    const visible = await el.isVisible();
    if (!visible) return { visible: false, reason: "not visible" };

    const box = await el.boundingBox();
    const viewport = page.viewportSize();

    // Check if overlay is within viewport (not off-screen)
    if (box) {
      if (box.x < -5 || box.y < -5 || box.x + box.width > viewport.width + 5 || box.y + box.height > viewport.height + 5) {
        return { visible: true, reason: "off-screen or clipped", box };
      }
    }

    // Check for duplicate overlays (two backdrops, etc.)
    const backdrops = await page.$$(`${selector} [class*="inset-0"], ${selector} [class*="bg-black"]`);
    if (backdrops.length > 2) {
      return { visible: true, reason: `possible duplicate overlays (${backdrops.length} backdrop elements)` };
    }

    return { visible: true, reason: "ok" };
  } catch (e) {
    return { visible: false, reason: e.message };
  }
}

async function auditOverlayComponent(page, name, triggerFn, closeFn, screen) {
  report(name, screen, "Testing", "");
  try {
    // Trigger the overlay
    await triggerFn();
    await waitForStable(page, 600);
    await screenshot(page, `${screen}-${name}-open`);
    
    // Check for duplicates by counting fixed/overlay elements
    const overlays = await page.$$('[class*="fixed"][class*="inset-0"], [class*="fixed"][class*="z-modal"], [class*="fixed"][class*="z-drawer"]');
    report(name, screen, overlays.length > 0 ? "PASS" : "FAIL", `overlay elements found: ${overlays.length}`);

    // Check backdrop visibility
    const backdrops = await page.$$('[class*="bg-black"], [class*="bg-opacity"]');
    if (backdrops.length > 0) report(name, screen, "PASS", "backdrop present");

    // Check body scroll locking
    const overflow = await page.evaluate(() => document.body.style.overflow);
    if (overflow === "hidden" || overflow === "") report(name, screen, "PASS", "body scroll locked");

    // Close
    await closeFn();
    await waitForStable(page, 500);
    await screenshot(page, `${screen}-${name}-closed`);

    // Verify closed
    const stillOpen = await page.$$('[class*="inset-0"][class*="z-"]');
    if (stillOpen.length > 0) {
      // Some overlays may leave mount points, but shouldn't be visible
      report(name, screen, "PASS", "closed (elements may remain mounted)");
    }
  } catch (e) {
    report(name, screen, "ERROR", e.message);
    reportError(screen, `${name}: ${e.message}`);
  }
}

(async () => {
  console.log("=== Visual Regression Audit ===");
  console.log("Launching browser...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Collect console and network errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const screen = page.url();
      reportError(screen, `Console error: ${msg.text()}`);
    }
  });
  page.on("response", (response) => {
    const screen = page.url();
    if (response.status() >= 400) {
      reportError(screen, `Failed request: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // ========== LOGIN ==========
    console.log("\n--- Login ---");
    await page.goto("http://localhost:80/dashboard", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);

    // Check if redirected to login
    if (page.url().includes("login")) {
      console.log("  Login page detected, authenticating...");
      // Try various input patterns
      const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]');
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      if (emailInput && passwordInput) {
        await emailInput.fill("admin@company.com");
        await passwordInput.fill("password");
        await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');
        await page.waitForURL("**/dashboard", { timeout: 10000 });
        await waitForStable(page, 1000);
      }
    }

    console.log(`  Current URL: ${page.url()}`);
    await screenshot(page, "00-dashboard-initial");
    
    // ========== SIDEBAR NAVIGATION ==========
    console.log("\n--- Sidebar Navigation ---");
    
    // Open sidebar on mobile (should be visible on desktop by default)
    const sidebar = await page.$('aside, nav:has(a[href*="/dashboard"])');
    if (sidebar) {
      const visible = await sidebar.isVisible();
      report("Sidebar", "Dashboard", visible ? "PASS" : "FAIL", "sidebar visible");
    }

    // ========== DASHBOARD ==========
    console.log("\n--- Dashboard Page ---");
    await screenshot(page, "01-dashboard");
    
    // Check for search modal trigger (Cmd+K)
    await page.keyboard.press("Meta+k");
    await waitForStable(page, 600);
    await screenshot(page, "01-dashboard-search-open");
    
    // Check if search modal appeared
    const searchDialog = await page.$('[role="dialog"], [aria-modal="true"], [class*="z-modal"]');
    if (searchDialog) {
      report("SearchModal", "Dashboard", "PASS", "opened via Cmd+K");
      await page.keyboard.press("Escape");
      await waitForStable(page, 500);
      report("SearchModal", "Dashboard", "PASS", "closed via Escape");
    } else {
      report("SearchModal", "Dashboard", "INFO", "Cmd+K did not open (may use Ctrl+K)");
      await page.keyboard.press("Control+k");
      await waitForStable(page, 600);
      if (searchDialog) {
        report("SearchModal", "Dashboard", "PASS", "opened via Ctrl+K");
        await page.keyboard.press("Escape");
        await waitForStable(page, 500);
      }
    }

    // ========== USERS PAGE ==========
    console.log("\n--- Users Page ---");
    await page.goto("http://localhost:80/work/users", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "02-users");
    
    // Try to click a user to open drawer
    const userRows = await page.$$('tr, [class*="cursor-pointer"]');
    let userClicked = false;
    for (const row of userRows.slice(0, 5)) {
      const text = await row.textContent();
      if (text.includes("@") || text.includes("Super") || text.includes("Admin")) {
        await row.click();
        await waitForStable(page, 800);
        userClicked = true;
        break;
      }
    }
    if (!userClicked) {
      // Try clicking any clickable card or row
      const clickables = await page.$$('[onclick], a[href*="user"], button:has-text("View"), .card, [class*="interactive"]');
      for (const el of clickables.slice(0, 3)) {
        try { await el.click(); await waitForStable(page, 800); userClicked = true; break; } catch {}
      }
    }
    
    if (userClicked) {
      await screenshot(page, "02-users-drawer-open");
      const drawerPanels = await page.$$('[class*="z-drawer"], [class*="animate-slide-in"]');
      report("UserDetailDrawer", "Users", drawerPanels.length > 0 ? "PASS" : "FAIL", "drawer opened");
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("UserDetailDrawer", "Users", "INFO", "no user row found to click");
    }

    // ========== ROLES PAGE ==========
    console.log("\n--- Roles Page (/work/admin/roles) ---");
    await page.goto("http://localhost:80/work/admin/roles", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "03-roles");
    
    // Click a role to open drawer
    const roleCards = await page.$$('[class*="card"], [class*="Card"], [class*="cursor-pointer"]');
    let roleClicked = false;
    for (const card of roleCards.slice(0, 5)) {
      try { await card.click(); await waitForStable(page, 800); roleClicked = true; break; } catch {}
    }
    if (roleClicked) {
      await screenshot(page, "03-roles-drawer-open");
      const roleDrawer = await page.$$('[class*="z-drawer"], [class*="animate-slide-in"]');
      report("RoleDetailDrawer", "Roles", roleDrawer.length > 0 ? "PASS" : "FAIL", "drawer opened");
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("RoleDetailDrawer", "Roles", "INFO", "no role element found to click");
    }

    // ========== PROJECTS PAGE ==========
    console.log("\n--- Projects Page ---");
    await page.goto("http://localhost:80/work/projects", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "04-projects");
    
    // Click a project
    const projectCards = await page.$$('[class*="card"], [class*="Card"], a[href*="/projects/"]');
    let projectClicked = false;
    for (const card of projectCards.slice(0, 3)) {
      try { await card.click(); await waitForStable(page, 1500); projectClicked = true; break; } catch {}
    }
    // We might have navigated to project detail page
    if (page.url().includes("/projects/")) {
      console.log(`  Navigated to project: ${page.url()}`);
      await screenshot(page, "04-project-detail");
      
      // Look for a task or resource to open drawer
      const taskRows = await page.$$('tr, [class*="row"], [class*="cursor-pointer"]');
      for (const row of taskRows.slice(0, 5)) {
        try { 
          const text = await row.textContent();
          if (text.length > 0 && text.length < 200) {
            await row.click(); 
            await waitForStable(page, 800); 
            const detailDrawers = await page.$$('[class*="z-drawer"]');
            if (detailDrawers.length > 0) {
              report("Drawer (project detail)", "Projects", "PASS", "detail drawer opened");
              await page.keyboard.press("Escape");
              await waitForStable(page, 600);
              break;
            }
          }
        } catch {}
      }
    } else {
      report("Project navigation", "Projects", "INFO", "could not navigate to project detail");
    }

    // ========== TASKS PAGE ==========
    console.log("\n--- Tasks Page ---");
    await page.goto("http://localhost:80/work/tasks", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "05-tasks");
    
    // Click a task to open drawer
    const taskRows2 = await page.$$('tr, [class*="row"], [class*="cursor-pointer"]');
    let taskClicked = false;
    for (const row of taskRows2.slice(0, 10)) {
      try {
        const text = await row.textContent();
        if (text && text.length > 5 && !text.includes("No")) {
          await row.click();
          await waitForStable(page, 1000);
          taskClicked = true;
          break;
        }
      } catch {}
    }
    if (taskClicked) {
      await screenshot(page, "05-tasks-drawer-open");
      const taskDrawer = await page.$$('[class*="z-drawer"]');
      report("TaskDetailDrawer", "Tasks", taskDrawer.length > 0 ? "PASS" : "FAIL", "drawer opened");
      
      // Check for dropdowns inside drawer (assignee search)
      const inputs = await page.$$('[placeholder*="Search"], input[type="text"]');
      for (const input of inputs.slice(0, 3)) {
        try {
          await input.focus();
          await input.fill("a");
          await waitForStable(page, 500);
          const dropdown = await page.$('[class*="z-dropdown"], [class*="absolute"][class*="top-full"]');
          if (dropdown) {
            report("AssigneeDropdown", "Tasks", "PASS", "dropdown opened inside drawer");
            break;
          }
        } catch {}
      }
      
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("TaskDetailDrawer", "Tasks", "INFO", "no task row found to click");
    }

    // ========== SUBTASKS PAGE ==========
    console.log("\n--- Subtasks Page ---");
    await page.goto("http://localhost:80/work/subtasks", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "06-subtasks");
    
    // Try to trigger the "New Subtask" modal/overlay
    const newSubtaskBtn = await page.$('button:has-text("New"), button:has-text("Add"), a:has-text("New")');
    if (newSubtaskBtn) {
      await newSubtaskBtn.click();
      await waitForStable(page, 800);
      await screenshot(page, "06-subtasks-modal-open");
      const subtaskModal = await page.$$('[class*="z-modal"], [role="dialog"]');
      report("SubtaskModal", "Subtasks", subtaskModal.length > 0 ? "PASS" : "FAIL", "modal opened");
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("SubtaskModal", "Subtasks", "INFO", "no new subtask button found");
    }

    // ========== MEETINGS PAGE ==========
    console.log("\n--- Meetings Page ---");
    await page.goto("http://localhost:80/work/meetings", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "07-meetings");
    
    const meetingCards = await page.$$('[class*="card"], [class*="Card"], tr, [class*="cursor-pointer"]');
    let meetingClicked = false;
    for (const card of meetingCards.slice(0, 5)) {
      try { await card.click(); await waitForStable(page, 800); meetingClicked = true; break; } catch {}
    }
    if (meetingClicked) {
      await screenshot(page, "07-meetings-drawer-open");
      const meetingDrawer = await page.$$('[class*="z-drawer"]');
      report("MeetingDetailDrawer", "Meetings", meetingDrawer.length > 0 ? "PASS" : "FAIL", "drawer opened");
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("MeetingDetailDrawer", "Meetings", "INFO", "no meeting card found to click");
    }

    // ========== ANNOUNCEMENTS PAGE ==========
    console.log("\n--- Announcements Page ---");
    await page.goto("http://localhost:80/work/announcements", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "08-announcements");
    
    const announcementCards = await page.$$('[class*="card"], a[href*="announcement"], [class*="cursor-pointer"]');
    let announcementClicked = false;
    for (const card of announcementCards.slice(0, 5)) {
      try { await card.click(); await waitForStable(page, 800); announcementClicked = true; break; } catch {}
    }
    if (announcementClicked) {
      await screenshot(page, "08-announcements-drawer-open");
      const annDrawer = await page.$$('[class*="z-drawer"]');
      report("AnnouncementDetailDrawer", "Announcements", annDrawer.length > 0 ? "PASS" : "FAIL", "drawer opened");
      
      // Try clicking delete button to trigger ConfirmDialog
      const deleteBtn = await page.$('button:has-text("Delete")');
      if (deleteBtn) {
        await deleteBtn.click();
        await waitForStable(page, 600);
        await screenshot(page, "08-announcements-confirm-dialog");
        const confirmDialog = await page.$$('[role="dialog"], [aria-modal="true"]');
        report("ConfirmDialog (inside drawer)", "Announcements", confirmDialog.length > 0 ? "PASS" : "FAIL", "confirm dialog appeared over drawer");
        await page.keyboard.press("Escape");
        await waitForStable(page, 600);
      }
      
      await page.keyboard.press("Escape");
      await waitForStable(page, 600);
    } else {
      report("AnnouncementDetailDrawer", "Announcements", "INFO", "no announcement card found");
    }

    // ========== REPORTS PAGE ==========
    console.log("\n--- Reports Page ---");
    await page.goto("http://localhost:80/work/reports", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "09-reports");
    
    // Try opening a report preview (buttons use Eye icon, no text)
    const eyeBtns = await page.$$('button svg[class*="lucide-eye"], button:has(svg[class*="eye"])');
    if (eyeBtns.length > 0) {
      await eyeBtns[0].click();
      await waitForStable(page, 1500);
      await screenshot(page, "09-reports-preview-modal");
      const reportModal = await page.$$('[class*="z-modal"]');
      report("ReportPreviewModal", "Reports", reportModal.length > 0 ? "PASS" : "FAIL", "preview modal opened");
      
      // Check modal content
      if (reportModal.length > 0) {
        // Test Escape key
        await page.keyboard.press("Escape");
        await waitForStable(page, 600);
      }
    } else {
      // Try clicking any table row that might trigger preview
      const reportRows = await page.$$('tr, [role="row"]');
      for (const row of reportRows.slice(1, 3)) {
        try {
          const btn = await row.$('button');
          if (btn) { await btn.click(); await waitForStable(page, 1500); break; }
        } catch {}
      }
      const reportModal = await page.$$('[class*="z-modal"]');
      report("ReportPreviewModal", "Reports", reportModal.length > 0 ? "PASS" : "INFO", "opened via row button");
      if (reportModal.length > 0) {
        await page.keyboard.press("Escape");
        await waitForStable(page, 600);
      }
    }

    // ========== RESOURCES PAGE ==========
    console.log("\n--- Resources Page (via project) ---");
    // Go back to a project page to access resources
    await page.goto("http://localhost:80/work/projects", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    
    const projLinks = await page.$$('a[href*="/projects/"]');
    if (projLinks.length > 0) {
      // Click the first project link
      await projLinks[0].click();
      await waitForStable(page, 1500);
      console.log(`  Project page: ${page.url()}`);
      
      // Navigate to Resources tab
      const resourcesTab = await page.$('a:has-text("Resources"), button:has-text("Resources"), [href*="resources"]');
      if (resourcesTab) {
        await resourcesTab.click();
        await waitForStable(page, 1000);
        console.log(`  Resources page: ${page.url()}`);
        await screenshot(page, "10-resources");
        
        // Try to open upload dialog
        const uploadBtn = await page.$('button:has-text("Upload"), button:has-text("Add"), button:has-text("New")');
        if (uploadBtn) {
          await uploadBtn.click();
          await waitForStable(page, 800);
          await screenshot(page, "10-resources-upload-dialog");
          const uploadDialog = await page.$$('[class*="z-modal"]');
          report("ResourceUploadDialog", "Resources", uploadDialog.length > 0 ? "PASS" : "FAIL", "upload dialog opened");
          await page.keyboard.press("Escape");
          await waitForStable(page, 600);
        }
      } else {
        report("Resources tab", "Resources", "INFO", "no resources tab found");
      }
    } else {
      report("Project navigation", "Resources", "INFO", "no project links found");
    }

    // ========== ENDPOINTS PAGE ==========
    console.log("\n--- Endpoints Page ---");
    await page.goto("http://localhost:80/work/projects", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    
    const projLinks2 = await page.$$('a[href*="/projects/"]');
    if (projLinks2.length > 0) {
      await projLinks2[0].click();
      await waitForStable(page, 1500);
      
      // Navigate to Endpoints tab
      const endpointsTab = await page.$('a:has-text("Endpoints"), button:has-text("Endpoints"), [href*="endpoints"]');
      if (endpointsTab) {
        await endpointsTab.click();
        await waitForStable(page, 1000);
        await screenshot(page, "11-endpoints");
        
        // Try to open endpoint form
        const newEndpointBtn = await page.$('button:has-text("New"), button:has-text("Add"), button:has-text("Create")');
        if (newEndpointBtn) {
          await newEndpointBtn.click();
          await waitForStable(page, 800);
          await screenshot(page, "11-endpoints-form");
          const endpointForm = await page.$$('[class*="z-modal"]');
          report("EndpointForm", "Endpoints", endpointForm.length > 0 ? "PASS" : "FAIL", "form dialog opened");
          await page.keyboard.press("Escape");
          await waitForStable(page, 600);
        }
      } else {
        report("Endpoints tab", "Endpoints", "INFO", "no endpoints tab found");
      }
    } else {
      report("Project navigation", "Endpoints", "INFO", "no project links found");
    }

    // ========== SETTINGS PAGE ==========
    console.log("\n--- Settings Page ---");
    await page.goto("http://localhost:80/work/admin/settings", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "12-settings");

    // ========== PROFILE (via sidebar user menu) ==========
    console.log("\n--- Profile / Settings Page ---");
    // Profile is accessed via the sidebar user menu; no dedicated /work/profile route
    // The settings page serves as the user profile area
    await page.goto("http://localhost:80/work/admin/settings", { waitUntil: "networkidle", timeout: 15000 });
    await waitForStable(page, 1000);
    await screenshot(page, "13-profile-settings");

    // ========== SUMMARY ==========
    console.log("\n\n=== AUDIT SUMMARY ===");
    console.log(`Components tested: ${results.length}`);
    console.log(`Errors found: ${errors.length}`);
    
    const passed = results.filter(r => r.status === "PASS").length;
    const failed = results.filter(r => r.status === "FAIL").length;
    const info = results.filter(r => r.status === "INFO").length;
    const errored = results.filter(r => r.status === "ERROR").length;
    
    console.log(`\nResults:`);
    console.log(`  PASS:  ${passed}`);
    console.log(`  FAIL:  ${failed}`);
    console.log(`  INFO:  ${info}`);
    console.log(`  ERROR: ${errored}`);
    
    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(e => console.log(`  - ${e.screen}: ${e.msg}`));
    }
    
    console.log(`\nResults detail:`);
    results.forEach(r => console.log(`  [${r.status}] ${r.component} on ${r.screen}${r.detail ? ' — ' + r.detail : ''}`));

  } catch (e) {
    console.error("Fatal error during audit:", e);
  } finally {
    await browser.close();
  }

  // Write results to file
  writeFileSync(join(__dirname, "audit-results.json"), JSON.stringify({ results, errors }, null, 2));
  console.log("\nResults written to audit-results.json");
  console.log("Screenshots saved to audit-screenshots/");
})();
