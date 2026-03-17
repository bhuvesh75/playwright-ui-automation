/**
 * @file        fixtures.js
 * @description Custom Playwright test fixtures that use a worker-scoped browser
 *              context. All spec files should import { test, expect } from this
 *              module instead of directly from @playwright/test.
 *
 * WHY: Playwright creates a fresh browser context (and therefore an EMPTY HTTP
 * cache) for each test by default. When saucedemo.com's CDN rate-limits
 * page-load requests from GitHub Actions IPs, the 3rd+ test that navigates to
 * /inventory.html will hit the rate-limit because each test started with an
 * empty cache and had to make a live CDN request.
 *
 * By making the browser context WORKER-scoped, all tests in a worker share the
 * same context — and the same HTTP cache. The first test in the worker warms
 * the cache; subsequent tests get cache hits and never touch the CDN again.
 * This is the Playwright equivalent of Cypress's testIsolation: false.
 *
 * Test isolation is preserved because each test still gets a FRESH PAGE from
 * the shared context. A fresh page has no accumulated DOM state from previous
 * tests. The only shared state is the HTTP cache (intentional) and the
 * context-level storageState (auth, also intentional — login tests clear it
 * themselves via page.addInitScript inside navigateToLogin()).
 *
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const base   = require('@playwright/test');
const path   = require('path');

// Path to the auth state saved by globalSetup
const AUTH_STATE = path.resolve(__dirname, '../playwright/.auth/user.json');

exports.test = base.test.extend({
  /**
   * Worker-scoped browser context — created once per worker and shared across
   * all tests assigned to that worker. The HTTP cache in this context persists
   * between tests, so only the first navigation to a given URL makes a live
   * CDN request; every subsequent navigation is a cache hit.
   *
   * storageState is loaded once when the context is created. Every fresh page
   * from this context inherits the localStorage / cookies from the auth state.
   *
   * WHY: worker scope (not test scope) is critical — test scope is the default
   * and it discards the context (and its HTTP cache) after every test.
   */
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: AUTH_STATE,
        viewport: { width: 1280, height: 720 },
      });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  /**
   * Test-scoped page from the shared worker context.
   * Each test gets a fresh page (no accumulated DOM from previous tests), but
   * the underlying browser context — and its HTTP cache — are shared.
   */
  page: async ({ workerContext }, use) => {
    const page = await workerContext.newPage();
    await use(page);
    await page.close();
  },
});

exports.expect = base.expect;
