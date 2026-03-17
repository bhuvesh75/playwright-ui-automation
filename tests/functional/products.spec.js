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
 * WHY: A single page is shared across all tests in this file via beforeAll
 * (not beforeEach). Every test that calls page.goto('/inventory.html') is a
 * cold CDN request from GitHub Actions, which triggers saucedemo.com's CDN
 * rate-limiter after 2–3 rapid requests. With 6 tests each navigating in
 * beforeEach, all sort tests timed out because the CDN blocked the HTML
 * response for > 120 s on every subsequent attempt.
 *
 * All products tests are safe to share one page because:
 * - Product count test:  reads the DOM, does not mutate it.
 * - Sort tests:          each test sets its own sort order before asserting;
 *                        prior sort state from the previous test does not affect
 *                        the result.
 * - Product names test:  reads product names, does not mutate the page.
 *
 * workerContext (worker-scoped fixture) provides the shared browser context
 * whose HTTP cache is warmed by earlier tests in the worker. Using a page from
 * this context means the second and subsequent navigations in the worker hit
 * the cache rather than the CDN.
 */

let sharedPage;
let inventoryPage;

test.describe('Functional: Product Inventory', () => {

  test.beforeAll(async ({ workerContext }) => {
    sharedPage    = await workerContext.newPage();
    inventoryPage = new InventoryPage(sharedPage);
    await inventoryPage.navigate();
    await inventoryPage.assertOnInventoryPage();
  });

  test.afterAll(async () => {
    await sharedPage?.close();
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
