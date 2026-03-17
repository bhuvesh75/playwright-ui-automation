/**
 * @file        products.spec.js
 * @description Functional tests for the Sauce Demo product inventory page.
 *              Validates product count, sort options, and product name display.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('../../support/fixtures');
const InventoryPage = require('../../pages/InventoryPage');
const products      = require('../../fixtures/products.json');

/**
 * WHY: A single page is shared across ALL tests and ALL retries via
 * module-level state managed in beforeAll.
 *
 * Problem: Every page.goto('/inventory.html') is a cold CDN request from
 * GitHub Actions, which hits saucedemo.com's CDN rate-limiter. With the
 * 120 s waitFor timeout, the sort dropdown loads ~1–2 s AFTER the timeout
 * expires (CDN delivers the JS bundle just too late). Playwright then retries
 * the test, re-runs beforeAll, and navigates AGAIN — hitting the CDN a second
 * and third time. Each retry encounters the same rate-limit and times out at
 * exactly 120 s, just before the dropdown loads.
 *
 * Fix: Keep sharedPage alive across retries. On retry, beforeAll checks the
 * current URL; if the page is already at /inventory.html (successful first
 * navigation), it skips re-navigation. The already-rendered page has the sort
 * dropdown in the DOM from the first load, so the retry's sortBy() call
 * finds the element immediately and succeeds.
 *
 * All products tests are safe to share one page because:
 * - Product count test:  reads the DOM, does not mutate it.
 * - Sort tests:          each test sets its own sort order before asserting;
 *                        prior sort state from the previous test does not affect
 *                        the result.
 * - Product names test:  reads product names, does not mutate the page.
 */

let sharedPage = null;
let inventoryPage = null;

test.describe('Functional: Product Inventory', () => {

  test.beforeAll(async ({ workerContext }) => {
    // Create the page only once — reuse on retries so CDN is not hit again.
    if (!sharedPage || sharedPage.isClosed()) {
      sharedPage    = await workerContext.newPage();
      inventoryPage = new InventoryPage(sharedPage);
    }
    // Navigate only if the page is not already at /inventory.html.
    // WHY: On test retry, beforeAll re-runs. If the FIRST attempt loaded the
    // page successfully (productList visible) but the sort dropdown timed out
    // at 120 s, the page is already loaded — we just need to use it again.
    // Re-navigating would hit the CDN again and replay the same timeout.
    if (!sharedPage.url().includes('/inventory.html')) {
      await inventoryPage.navigate();
      await inventoryPage.assertOnInventoryPage();
    }
  });

  test.afterAll(async () => {
    await sharedPage?.close();
    sharedPage    = null;
    inventoryPage = null;
  });

  /**
   * @test        All 6 products are rendered
   * @given       User is logged in and on the inventory page
   * @when        The page finishes loading
   * @then        Exactly 6 product items are visible
   */
  test('should display all 6 products', async () => {
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(products.expectedCount);
  });

  /**
   * @test        Sort A to Z — "Sauce Labs Backpack" is first
   * @given       User is on the inventory page
   * @when        User selects "Name (A to Z)" sort option
   * @then        First product is "Sauce Labs Backpack"
   */
  test('should sort products A to Z', async () => {
    await inventoryPage.sortBy('az');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.firstAlphabetically);
  });

  /**
   * @test        Sort Z to A — "Test.allTheThings() T-Shirt (Red)" is first
   * @given       User is on the inventory page
   * @when        User selects "Name (Z to A)" sort option
   * @then        First product is "Test.allTheThings() T-Shirt (Red)"
   */
  test('should sort products Z to A', async () => {
    await inventoryPage.sortBy('za');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.lastAlphabetically);
  });

  /**
   * @test        Sort price low to high — "Sauce Labs Onesie" is first
   * @given       User is on the inventory page
   * @when        User selects "Price (low to high)" sort option
   * @then        First product is the cheapest item
   */
  test('should sort products by price low to high', async () => {
    await inventoryPage.sortBy('lohi');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.cheapest);
  });

  /**
   * @test        Sort price high to low — "Sauce Labs Fleece Jacket" is first
   * @given       User is on the inventory page
   * @when        User selects "Price (high to low)" sort option
   * @then        First product is the most expensive item
   */
  test('should sort products by price high to low', async () => {
    await inventoryPage.sortBy('hilo');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.mostExpensive);
  });

  /**
   * @test        All expected product names are present
   * @given       User is on the inventory page
   * @when        The page renders all products
   * @then        Every product name from the fixture is visible on the page
   */
  test('should display all expected product names', async () => {
    for (const name of products.items) {
      await expect(
        sharedPage.locator('.inventory_item_name', { hasText: name })
      ).toBeVisible();
    }
  });
});
