/**
 * @file        playwright.config.js
 * @description Central Playwright configuration defining browser settings,
 *              timeouts, retry behaviour, reporters, and auth state.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  /** Directory that Playwright scans for spec files. */
  testDir: './tests',

  /**
   * WHY: Disabled parallel test execution within a single file.
   * saucedemo.com's CDN rate-limits rapid concurrent page-load requests from
   * GitHub Actions IPs. Running tests sequentially (fullyParallel: false,
   * workers: 1) spreads CDN requests over time, staying within the rate limit.
   */
  fullyParallel: false,

  /** Fail the build if test.only is accidentally left in source. */
  forbidOnly: !!process.env.CI,

  /**
   * WHY: Retry tests twice in CI. saucedemo.com occasionally returns 404 or
   * connection-refused from GitHub Actions IPs within a CDN rate-limit burst
   * window (~30–60 s). Two retries absorb transient failures without masking
   * genuine bugs — a real bug fails all three attempts consistently.
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * WHY: Single worker to prevent parallel CDN requests from the same
   * GitHub Actions runner IP — the leading cause of CI timeouts on public
   * demo sites served via rate-limited CDNs.
   */
  workers: 1,

  /** Reporters: HTML for CI artifacts, list for readable terminal output. */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    /** Base URL so tests can use relative paths like page.goto('/inventory.html'). */
    baseURL: 'https://www.saucedemo.com',

    /**
     * WHY: 120 s navigation timeout mirrors the Cypress pageLoadTimeout.
     * saucedemo.com loads in 30–60 s from GitHub Actions; 60 s caused
     * intermittent failures under runner load. 120 s gives a generous buffer.
     */
    navigationTimeout: 120_000,

    /**
     * WHY: 60 s action timeout for clicks, fills, selectOption, and assertions.
     * The sort dropdown on saucedemo.com can take > 15 s to become interactable
     * in CI when the CDN rate-limits subsequent page-load requests from the same
     * GitHub Actions IP. 60 s absorbs these delays without masking real bugs —
     * a genuinely missing element would still fail every attempt.
     */
    actionTimeout: 60_000,

    /** Full trace recorded only on the first retry — keeps artifact sizes small. */
    trace: 'on-first-retry',

    /** Screenshot captured only when a test fails — aids post-mortem debugging. */
    screenshot: 'only-on-failure',

    /** Video recorded only for failing tests — avoids large artifact uploads. */
    video: 'retain-on-failure',

    /**
     * WHY: storageState restores the authenticated localStorage/cookies that
     * globalSetup saved after a single login. Authenticated tests start with
     * session-username already set in localStorage so React skips the login
     * form and loads /inventory.html directly — no extra CDN hit for login.
     * Login-page tests override this per-test using page.addInitScript() to
     * clear localStorage before navigation, forcing React to render the form.
     */
    storageState: 'playwright/.auth/user.json',

    /** Desktop viewport matching CI and local development screens. */
    viewport: { width: 1280, height: 720 },

    headless: true,
  },

  /**
   * WHY: globalSetup runs once before any test. It logs in via the real login
   * form, then saves the browser's localStorage and cookies to
   * playwright/.auth/user.json. All authenticated tests restore this state via
   * the storageState option above — saucedemo.com is visited exactly once for
   * the login CDN request rather than once per test.
   */
  globalSetup: './support/globalSetup.js',

  /**
   * WHY: 180 s per-test timeout. Each test runs beforeEach (which navigates to
   * saucedemo.com — up to 120 s on a rate-limited CDN) plus the test body.
   * 60 s was too tight; a slow navigation plus a slow selectOption could exhaust
   * the budget before the test had a chance to complete.
   */
  timeout: 180_000,

  expect: {
    /** Max time for a single expect() assertion to resolve. */
    timeout: 10_000,
  },
});
