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

      /**
       * WHY: The worker-scoped context shares its HTTP cache across all tests,
       * but only after something has populated that cache. saucedemo.com is a
       * React SPA — the initial HTML is served instantly, but the JS bundle
       * that hydrates React (including the sort dropdown and cart buttons) can
       * take 3–5 minutes to download from GitHub Actions IPs due to CDN
       * rate-limiting. If no warmup is performed, the FIRST navigate() call
       * returns as soon as domcontentloaded fires (HTML parsed, static product
       * list visible), but React hasn't hydrated — so the sort dropdown and
       * all interactive elements added by React are absent from the DOM.
       *
       * By loading the root URL here with waitUntil:'load', we block until ALL
       * resources — including the JS bundle — have finished downloading. The
       * bundle is then in the browser's HTTP cache. Every subsequent navigate()
       * in every test gets the bundle from cache in milliseconds, and React
       * hydrates immediately after domcontentloaded fires.
       *
       * The try/catch makes this non-fatal: if the warmup itself times out
       * (e.g., CDN completely unreachable), tests still run — they may fail,
       * but the individual retry logic in each test file provides a second
       * chance rather than aborting the whole suite up front.
       */
      const warmupPage = await context.newPage();
      try {
        // 360 s covers the observed worst-case CDN delivery time (~3–5 min).
        // WHY root URL: saucedemo.com serves the same HTML shell for all routes.
        // The JS bundle referenced in that shell is what we need cached.
        // With storageState set, React will client-side-redirect to /inventory.html
        // after hydration, but the 'load' event fires once the bundle finishes —
        // which is exactly the signal we need.
        await warmupPage.goto('/', { waitUntil: 'load', timeout: 360_000 });
      } catch {
        // Non-fatal: bundle may still be partially cached; tests have retries.
      } finally {
        await warmupPage.close();
      }

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
