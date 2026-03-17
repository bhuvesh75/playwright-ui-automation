/**
 * @file        globalSetup.js
 * @description Playwright global setup — runs ONCE before any test file.
 *              Logs into Sauce Demo via the real login form and saves the
 *              resulting browser state (localStorage + cookies) to disk.
 *              All authenticated tests restore this state via storageState,
 *              eliminating per-test login CDN hits.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/** Path where the authenticated browser state is persisted. */
const STORAGE_STATE_PATH = path.join(
  __dirname,
  '../playwright/.auth/user.json'
);

/**
 * WHY: Logging in once during globalSetup and caching the auth state avoids
 * repeated cy.visit('/') + credential entry in every test's beforeEach.
 * saucedemo.com's CDN rate-limits consecutive page-load requests from GitHub
 * Actions IPs. By restricting the login CDN hit to a single globalSetup run,
 * authenticated tests can navigate directly to /inventory.html with a warmed
 * localStorage — React skips the login redirect without any CDN round-trip.
 */
async function globalSetup() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('[globalSetup] Logging in to save auth state…');

  // Navigate to the login page
  await page.goto('https://www.saucedemo.com', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });

  // Enter valid credentials
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');

  // Wait until the inventory page loads (confirms login succeeded)
  await page.waitForURL('**/inventory.html', { timeout: 120_000 });

  // Ensure the auth directory exists before writing the file
  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save localStorage + cookies to disk
  await context.storageState({ path: STORAGE_STATE_PATH });

  console.log(`[globalSetup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}

module.exports = globalSetup;
