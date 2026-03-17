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
       * WHY: In-process JS bundle cache via Playwright route interception.
       *
       * saucedemo.com serves its JS bundle with Cache-Control: no-cache, which
       * forces the browser to revalidate on every request (sending an
       * If-None-Match / If-Modified-Since conditional request to the CDN).
       * When the CDN rate-limits requests from GitHub Actions IPs, those
       * revalidation requests hang — and the browser cannot use its cached
       * copy until the CDN responds. React therefore never mounts, the sort
       * dropdown and cart buttons (JS-only elements) never appear, and tests
       * time out even though the bundle was already fetched once.
       *
       * Fix: intercept every .js request for saucedemo.com at the Playwright
       * level (below the browser). On the FIRST request for a given URL we
       * let it go through normally and save the response body in jsCache. On
       * every SUBSEQUENT request for the same URL we fulfill immediately from
       * jsCache — no network round-trip, no CDN involvement, no rate-limit.
       * React hydrates in milliseconds on every page load after the first.
       *
       * The first request still hits the CDN, so it must succeed. In practice
       * the CDN has not yet started rate-limiting when the worker starts
       * (confirmed by cart tests passing in ~400 ms), so the first fetch
       * always succeeds.
       */
      const jsCache = new Map();
      await context.route(
        (url) => url.hostname.endsWith('saucedemo.com') && url.pathname.endsWith('.js'),
        async (route) => {
          const url = route.request().url();
          if (jsCache.has(url)) {
            // Serve from in-process memory — no CDN hit.
            await route.fulfill({
              status: 200,
              contentType: 'application/javascript',
              body: jsCache.get(url),
            });
            return;
          }
          // First request: fetch normally, cache the body for future requests.
          const response = await route.fetch();
          const body     = await response.body();
          jsCache.set(url, body);
          await route.fulfill({ response, body });
        }
      );

      /**
       * WHY: Warmup navigation ensures the jsCache is populated before any
       * test runs. Without warmup, the first test that requests a JS bundle
       * would populate the cache — but if that test is a sort test or cart
       * test where the interactive elements are needed immediately, the test
       * might fail before the route handler has time to cache the bundle.
       *
       * By navigating to / with waitUntil:'load' here, we guarantee the
       * bundle has been fetched (and cached by the route handler above) before
       * the first test starts. Subsequent navigations by test code never reach
       * the CDN for JS resources.
       *
       * The try/catch is non-fatal because even if the warmup times out, the
       * route handler still activates for the first actual test's navigate()
       * call and caches the bundle then. Tests have retries as a safety net.
       */
      const warmupPage = await context.newPage();
      try {
        // 360 s covers the observed worst-case CDN delivery time (~3–5 min).
        await warmupPage.goto('/', { waitUntil: 'load', timeout: 360_000 });
      } catch {
        // Non-fatal — route interception still caches on first test navigate.
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
